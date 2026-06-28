// ============================================================
// ARCHIVO  : crm-breederhub.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-26
// PROPÓSITO: Gadget Decision Inbox del polígono BreederHub.
//            Muestra ítems accionables (breederhub_items/) con
//            flujo de validación Alert/Suggest/Act. Gate de
//            acceso: rol ADMIN (verificado en ignition §15).
// RUNTIME  : Web Component Light DOM montado en #orb4-kyc-shell.
// STACK    : vanilla JS + Firebase Firestore (instancia AIP).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — enums, estilos, etiquetas
// [SEC-03] Helpers puros
// [SEC-04] Clase CrmBreederhub — Web Component
//   [SEC-04a] Campos privados + lifecycle (connectedCallback / disconnectedCallback)
//   [SEC-04b] _open — inicialización y subscripción Firestore
//   [SEC-04c] _renderShell — chrome estático del panel
//   [SEC-04d] _renderList — lista de ítems (actualización incremental)
//   [SEC-04e] _renderDetail — panel de detalle de un ítem
//   [SEC-04f] _renderCreator — formulario de creación (inline)
//   [SEC-04g] _wire — event delegation interna
//   [SEC-04h] _updateItem / _createItem — escrituras Firestore
//   [SEC-04i] _emit — bus canónico de salida
// [SEC-05] Registro customElements

// DOCTRINA
//   R2  — Light DOM estricto: sin attachShadow()
//   R32 — Sin innerHTML con datos externos: títulos, descripciones y campos
//         del usuario se inyectan vía createElement + textContent.
//         innerHTML solo para chrome estático (sin datos del usuario).
//   R8  — Textos de UI con data-i18n (fallback ES embebido).
//   R-CROSS-01 — Bus namespace AIP: Skeleton:Breederhub:*

// ─── [SEC-01] Importaciones y dependencias ────────────────────────────────────

import { ReactiveElement } from '../03-interface/base/reactive-element.js';
import {
    getFirestore, collection, query, where, orderBy,
    onSnapshot, doc, updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore';

// ─── [SEC-02] Constantes — enums, estilos, etiquetas ─────────────────────────

const TIPOS = [
    'DECISION', 'DESPACHO', 'INVESTIGACION', 'TICKET', 'HITO', 'NODO', 'DOCTRINA'
];

const VERTICALES = [
    'AIP', 'DEMIURGO', 'GLOBIZMARKT', 'CPII', 'TRANSVERSAL'
];

const PRIORIDADES = ['P0', 'P1', 'P2', 'P3'];

const AUTONOMIA_LABEL = {
    Alert:   '🔔 Alert',
    Suggest: '💡 Suggest',
    Act:     '⚡ Act',
};

const PRIO_COLOR = { P0: '#ef4444', P1: '#f97316', P2: '#eab308', P3: '#6b7280' };

const _CSS = `
<style>
/* [SEC-02] crm-breederhub — tokens sobre paleta CRM */
crm-breederhub { display:block; font-family: var(--crm-font-sans, 'Inter', system-ui, sans-serif); }

.bhub {
    display:flex; flex-direction:column; width:100%; max-width:720px; margin:0 auto;
    background: var(--crm-surface, #0a0f1e);
    border: 1px solid var(--crm-border, rgba(255,255,255,0.08));
    border-radius:12px; overflow:hidden; max-height:90vh;
    color: var(--crm-text, #e2e8f0);
}

/* Header */
.bhub__topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 20px; border-bottom:1px solid var(--crm-border, rgba(255,255,255,0.08));
    background: var(--crm-surface-alt, rgba(255,255,255,0.03));
}
.bhub__title { font-size:13px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; opacity:.7; }
.bhub__badge {
    font-size:11px; font-weight:700; padding:2px 8px;
    background: rgba(239,68,68,.15); color:#ef4444;
    border-radius:999px; margin-left:8px;
}
.bhub__close {
    background:none; border:none; color:inherit; cursor:pointer; opacity:.5; font-size:18px; padding:4px 8px;
}
.bhub__close:hover { opacity:1; }

/* Filtros */
.bhub__filters {
    display:flex; gap:8px; padding:10px 16px; border-bottom:1px solid var(--crm-border, rgba(255,255,255,0.08));
    flex-wrap:wrap;
}
.bhub__filters select {
    background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
    color:inherit; border-radius:6px; padding:4px 8px; font-size:12px; cursor:pointer;
}
.bhub__prio-btn {
    padding:3px 10px; border-radius:6px; border:1px solid transparent;
    font-size:11px; font-weight:700; cursor:pointer; background:rgba(255,255,255,0.06);
    color:inherit; transition:background .15s;
}
.bhub__prio-btn.active { border-color: currentColor; background: rgba(255,255,255,0.12); }

/* Lista */
.bhub__list { flex:1; overflow-y:auto; padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
.bhub__empty { padding:32px; text-align:center; opacity:.4; font-size:13px; }

/* Ítem */
.bhub__item {
    padding:12px 14px; border-radius:8px; cursor:pointer;
    background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06);
    transition:background .15s;
}
.bhub__item:hover, .bhub__item.selected { background: rgba(255,255,255,0.09); border-color:rgba(255,255,255,0.15); }
.bhub__item-header { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
.bhub__chip {
    font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px;
    background:rgba(255,255,255,0.1); letter-spacing:.04em;
}
.bhub__prio-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.bhub__item-title { font-size:13px; font-weight:500; line-height:1.4; }
.bhub__item-footer { display:flex; align-items:center; justify-content:space-between; margin-top:6px; }
.bhub__autonomia { font-size:11px; opacity:.6; }
.bhub__arrow { opacity:.4; font-size:14px; }

/* Panel detalle */
.bhub__detail {
    border-top:1px solid var(--crm-border, rgba(255,255,255,0.08));
    padding:16px 20px; background:rgba(255,255,255,0.02);
}
.bhub__detail-title { font-size:15px; font-weight:600; margin-bottom:8px; }
.bhub__detail-desc { font-size:13px; opacity:.75; margin-bottom:6px; line-height:1.6; }
.bhub__detail-meta { font-size:11px; opacity:.5; margin-bottom:12px; font-family:monospace; }
.bhub__actions { display:flex; gap:8px; flex-wrap:wrap; }
.bhub__action-btn {
    padding:7px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.15);
    background:rgba(255,255,255,0.07); color:inherit; cursor:pointer; font-size:12px; font-weight:600;
    transition:background .15s;
}
.bhub__action-btn:hover { background:rgba(255,255,255,0.15); }
.bhub__action-btn--approve { border-color:rgba(34,197,94,.4); color:#4ade80; }
.bhub__action-btn--reject  { border-color:rgba(239,68,68,.4);  color:#f87171; }
.bhub__action-btn--delegate { border-color:rgba(99,102,241,.4); color:#a5b4fc; }

/* Formulario creador */
.bhub__creator {
    border-top:1px solid var(--crm-border, rgba(255,255,255,0.08));
    padding:16px 20px; background:rgba(255,255,255,0.02);
}
.bhub__creator-title { font-size:12px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; opacity:.5; margin-bottom:12px; }
.bhub__form-row { display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
.bhub__form-row select, .bhub__form-row input, .bhub__form-row textarea {
    background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
    color:inherit; border-radius:6px; padding:6px 10px; font-size:12px; flex:1; min-width:120px;
}
.bhub__form-row textarea { resize:vertical; min-height:60px; font-family:inherit; }
.bhub__submit-btn {
    padding:8px 20px; border-radius:8px; border:none;
    background:rgba(99,102,241,.8); color:#fff; cursor:pointer; font-size:13px; font-weight:600;
    margin-top:4px; transition:background .15s;
}
.bhub__submit-btn:hover { background:rgba(99,102,241,1); }
.bhub__footer-bar {
    padding:10px 20px; border-top:1px solid var(--crm-border, rgba(255,255,255,0.08));
    display:flex; gap:8px; justify-content:flex-end;
}
.bhub__new-btn {
    background:none; border:1px solid rgba(255,255,255,0.15); color:inherit;
    border-radius:8px; padding:5px 14px; font-size:12px; cursor:pointer;
}
.bhub__new-btn:hover { background:rgba(255,255,255,0.08); }
</style>`;

// ─── [SEC-03] Helpers puros ───────────────────────────────────────────────────

function _c(tag, attrs = {}, text = null) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text !== null) el.textContent = text;
    return el;
}

function _ts(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit' })
        + ' ' + d.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
}

function _prio(p) {
    return PRIO_COLOR[p] || '#6b7280';
}

// ─── [SEC-04] Clase CrmBreederhub — Web Component ────────────────────────────

// [SEC-04a] Campos privados + lifecycle
class CrmBreederhub extends ReactiveElement {

    #unsubscribe = null;
    #items       = [];
    #selectedId  = null;
    #filterVertical  = 'ALL';
    #filterPriority  = 'ALL';
    #showCreator     = false;

    connectedCallback() {
        super.connectedCallback?.();
        this._renderShell();
        this._wire();
        this._open();
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this.#unsubscribe?.();
        this.#unsubscribe = null;
    }

    // ReactiveElement base — no usamos stateChanged (Firestore es la fuente de verdad aquí)
    stateChanged() {}

    // [SEC-04b] _open — subscripción Firestore
    _open() {
        const db = getFirestore();
        const q  = query(
            collection(db, 'breederhub_items'),
            where('estado', '==', 'PENDIENTE'),
            orderBy('prioridad'),
            orderBy('fecha_creacion')
        );

        this.#unsubscribe = onSnapshot(q, (snap) => {
            this.#items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            this._renderList();
            this._updateBadge();
        }, (err) => {
            console.error('[crm-breederhub] Firestore error:', err);
        });
    }

    // [SEC-04c] _renderShell — chrome estático del panel
    _renderShell() {
        // CSS una sola vez
        if (!document.getElementById('bhub-css')) {
            const tmp = document.createElement('template');
            tmp.innerHTML = _CSS;
            const styleEl = tmp.content.firstChild.cloneNode(true);
            styleEl.id = 'bhub-css';
            document.head.appendChild(styleEl);
        }

        this.innerHTML = '';

        // Contenedor principal
        const root = _c('div', { class: 'bhub' });

        // Header
        const topbar = _c('div', { class: 'bhub__topbar' });
        const titleWrap = _c('div', { style: 'display:flex;align-items:center;gap:0' });
        titleWrap.appendChild(_c('span', { class: 'bhub__title', 'data-i18n': 'bhub.title' }, 'BREEDERHUB CONTROL'));
        titleWrap.appendChild(_c('span', { class: 'bhub__badge', 'data-bhub-badge': '' }, '0'));
        topbar.appendChild(titleWrap);
        const closeBtn = _c('button', { class: 'bhub__close', 'data-action': 'close', 'data-i18n': 'bhub.close', title: 'Cerrar' }, '✕');
        topbar.appendChild(closeBtn);
        root.appendChild(topbar);

        // Filtros
        const filtersRow = _c('div', { class: 'bhub__filters' });

        const selVertical = _c('select', { 'data-action': 'filter-vertical', 'data-i18n-aria': 'bhub.filter.vertical' });
        const optAll = _c('option', { value: 'ALL' }, 'Todos los verticales');
        selVertical.appendChild(optAll);
        for (const v of VERTICALES) selVertical.appendChild(_c('option', { value: v }, v));
        filtersRow.appendChild(selVertical);

        // Botones de prioridad
        const prioWrap = _c('div', { style: 'display:flex;gap:4px;' });
        for (const p of ['ALL', ...PRIORIDADES]) {
            const btn = _c('button', {
                class: 'bhub__prio-btn' + (p === 'ALL' ? ' active' : ''),
                'data-action': 'filter-prio',
                'data-prio': p,
                style: p !== 'ALL' ? `color:${_prio(p)}` : ''
            }, p === 'ALL' ? 'Todos' : p);
            prioWrap.appendChild(btn);
        }
        filtersRow.appendChild(prioWrap);
        root.appendChild(filtersRow);

        // Lista (contenedor vacío — se rellena en _renderList)
        root.appendChild(_c('div', { class: 'bhub__list', 'data-bhub-list': '' }));

        // Panel detalle (oculto inicialmente)
        root.appendChild(_c('div', { class: 'bhub__detail', 'data-bhub-detail': '', style: 'display:none' }));

        // Footer
        const footerBar = _c('div', { class: 'bhub__footer-bar' });
        footerBar.appendChild(_c('button', { class: 'bhub__new-btn', 'data-action': 'toggle-creator', 'data-i18n': 'bhub.new' }, '+ Nuevo ítem'));
        root.appendChild(footerBar);

        // Formulario creador (oculto inicialmente)
        const creatorEl = _c('div', { class: 'bhub__creator', 'data-bhub-creator': '', style: 'display:none' });
        root.appendChild(creatorEl);

        this.appendChild(root);
    }

    // [SEC-04d] _renderList — lista de ítems
    _renderList() {
        const listEl = this.querySelector('[data-bhub-list]');
        if (!listEl) return;

        const filtered = this.#items.filter(item => {
            if (this.#filterVertical !== 'ALL' && item.vertical !== this.#filterVertical) return false;
            if (this.#filterPriority !== 'ALL' && item.prioridad !== this.#filterPriority) return false;
            return true;
        });

        listEl.innerHTML = '';

        if (filtered.length === 0) {
            listEl.appendChild(_c('div', { class: 'bhub__empty', 'data-i18n': 'bhub.empty' }, 'No hay ítems pendientes'));
            return;
        }

        for (const item of filtered) {
            const card = _c('div', {
                class: 'bhub__item' + (item.id === this.#selectedId ? ' selected' : ''),
                'data-action': 'select-item',
                'data-id': item.id
            });

            // Header de la card
            const header = _c('div', { class: 'bhub__item-header' });
            const dot    = _c('span', { class: 'bhub__prio-dot', style: `background:${_prio(item.prioridad || 'P3')}` });
            const tipo   = _c('span', { class: 'bhub__chip' }, item.tipo || '?');
            const vert   = _c('span', { class: 'bhub__chip' }, item.vertical || '?');
            header.appendChild(dot);
            header.appendChild(tipo);
            header.appendChild(vert);
            card.appendChild(header);

            // Título — R32: textContent
            card.appendChild(_c('div', { class: 'bhub__item-title' }, item.titulo || '—'));

            // Footer
            const footer = _c('div', { class: 'bhub__item-footer' });
            footer.appendChild(_c('span', { class: 'bhub__autonomia' }, AUTONOMIA_LABEL[item.autonomia] || item.autonomia || ''));
            footer.appendChild(_c('span', { class: 'bhub__arrow' }, '›'));
            card.appendChild(footer);

            listEl.appendChild(card);
        }
    }

    // [SEC-04e] _renderDetail — panel de detalle de un ítem
    _renderDetail(item) {
        const detailEl = this.querySelector('[data-bhub-detail]');
        if (!detailEl) return;

        detailEl.innerHTML = '';
        detailEl.style.display = 'block';

        // Título — R32
        detailEl.appendChild(_c('div', { class: 'bhub__detail-title' }, item.titulo || '—'));
        if (item.descripcion) {
            detailEl.appendChild(_c('div', { class: 'bhub__detail-desc' }, item.descripcion));
        }
        if (item.accion_propuesta) {
            detailEl.appendChild(_c('div', { class: 'bhub__detail-desc' }, '→ ' + item.accion_propuesta));
        }

        // Meta
        const meta = _c('div', { class: 'bhub__detail-meta' });
        meta.textContent = [
            item.prioridad,
            item.vertical,
            item.creado_por,
            _ts(item.fecha_creacion),
            item.referencia_disco || '',
        ].filter(Boolean).join(' · ');
        detailEl.appendChild(meta);

        // Acciones
        const actions = _c('div', { class: 'bhub__actions' });

        const btnApprove  = _c('button', { class: 'bhub__action-btn bhub__action-btn--approve', 'data-action': 'approve', 'data-id': item.id, 'data-i18n': 'bhub.approve' }, '✓ Aprobar');
        const btnReject   = _c('button', { class: 'bhub__action-btn bhub__action-btn--reject',  'data-action': 'reject',  'data-id': item.id, 'data-i18n': 'bhub.reject'  }, '✗ Rechazar');
        const btnDelegate = _c('button', { class: 'bhub__action-btn bhub__action-btn--delegate','data-action': 'delegate','data-id': item.id, 'data-i18n': 'bhub.delegate' }, '↪ Delegar');
        const btnSnooze   = _c('button', { class: 'bhub__action-btn', 'data-action': 'snooze',  'data-id': item.id, 'data-i18n': 'bhub.snooze'  }, '⏸ Snooze');

        actions.appendChild(btnApprove);
        actions.appendChild(btnReject);
        actions.appendChild(btnDelegate);
        actions.appendChild(btnSnooze);
        detailEl.appendChild(actions);

        // Marcar como EN_REVISION al abrir
        this._updateItem(item.id, { estado: 'EN_REVISION' });
    }

    // [SEC-04f] _renderCreator — formulario inline
    _renderCreator() {
        const creatorEl = this.querySelector('[data-bhub-creator]');
        if (!creatorEl) return;

        creatorEl.innerHTML = '';
        creatorEl.style.display = this.#showCreator ? 'block' : 'none';
        if (!this.#showCreator) return;

        creatorEl.appendChild(_c('div', { class: 'bhub__creator-title', 'data-i18n': 'bhub.new_item' }, 'NUEVO ÍTEM'));

        // Campos — construidos con createElement + textContent (R32)
        const form = _c('div', {});

        // Fila 1: tipo + vertical
        const row1 = _c('div', { class: 'bhub__form-row' });
        const selTipo = _c('select', { 'data-field': 'tipo' });
        selTipo.appendChild(_c('option', { value: '' }, 'Tipo…'));
        for (const t of TIPOS) selTipo.appendChild(_c('option', { value: t }, t));
        row1.appendChild(selTipo);

        const selVert = _c('select', { 'data-field': 'vertical' });
        selVert.appendChild(_c('option', { value: '' }, 'Vertical…'));
        for (const v of VERTICALES) selVert.appendChild(_c('option', { value: v }, v));
        row1.appendChild(selVert);
        form.appendChild(row1);

        // Fila 2: prioridad + autonomia
        const row2 = _c('div', { class: 'bhub__form-row' });
        const selPrio = _c('select', { 'data-field': 'prioridad' });
        selPrio.appendChild(_c('option', { value: '' }, 'Prioridad…'));
        for (const p of PRIORIDADES) selPrio.appendChild(_c('option', { value: p }, p));
        row2.appendChild(selPrio);

        const selAuto = _c('select', { 'data-field': 'autonomia' });
        selAuto.appendChild(_c('option', { value: '' }, 'Autonomía…'));
        for (const a of ['Alert', 'Suggest', 'Act']) selAuto.appendChild(_c('option', { value: a }, AUTONOMIA_LABEL[a]));
        row2.appendChild(selAuto);
        form.appendChild(row2);

        // Fila 3: título
        const row3 = _c('div', { class: 'bhub__form-row' });
        row3.appendChild(_c('input', { 'data-field': 'titulo', placeholder: 'Título (< 80 chars)', maxlength: '80', type: 'text' }));
        form.appendChild(row3);

        // Fila 4: descripción
        const row4 = _c('div', { class: 'bhub__form-row' });
        row4.appendChild(_c('textarea', { 'data-field': 'descripcion', placeholder: 'Descripción…' }));
        form.appendChild(row4);

        // Fila 5: acción propuesta
        const row5 = _c('div', { class: 'bhub__form-row' });
        row5.appendChild(_c('input', { 'data-field': 'accion_propuesta', placeholder: 'Acción propuesta (opcional)', type: 'text' }));
        form.appendChild(row5);

        // Fila 6: referencia disco
        const row6 = _c('div', { class: 'bhub__form-row' });
        row6.appendChild(_c('input', { 'data-field': 'referencia_disco', placeholder: 'Ruta en disco (opcional)', type: 'text' }));
        form.appendChild(row6);

        const submitBtn = _c('button', {
            class: 'bhub__submit-btn', 'data-action': 'submit-item', 'data-i18n': 'bhub.submit'
        }, 'Crear ítem');
        form.appendChild(submitBtn);

        creatorEl.appendChild(form);
    }

    // [SEC-04g] _wire — event delegation interna
    _wire() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;

            switch (action) {
                case 'close':
                    this._emit('Skeleton:Breederhub:Cancelled');
                    break;

                case 'filter-vertical': {
                    const sel = this.querySelector('[data-action="filter-vertical"]');
                    this.#filterVertical = sel?.value || 'ALL';
                    this._renderList();
                    break;
                }

                case 'filter-prio': {
                    this.#filterPriority = btn.dataset.prio || 'ALL';
                    this.querySelectorAll('.bhub__prio-btn').forEach(b =>
                        b.classList.toggle('active', b.dataset.prio === this.#filterPriority)
                    );
                    this._renderList();
                    break;
                }

                case 'select-item': {
                    const id   = btn.dataset.id;
                    const item = this.#items.find(i => i.id === id);
                    if (!item) return;
                    this.#selectedId = id;
                    this._renderList();
                    this._renderDetail(item);
                    break;
                }

                case 'approve':
                    this._updateItem(btn.dataset.id, { estado: 'APROBADO', fecha_resolucion: serverTimestamp() });
                    this._closeDetail();
                    break;

                case 'reject': {
                    const motivo = prompt('Motivo del rechazo:');
                    if (motivo === null) return;
                    this._updateItem(btn.dataset.id, {
                        estado: 'RECHAZADO',
                        motivo_rechazo: motivo,
                        fecha_resolucion: serverTimestamp()
                    });
                    this._closeDetail();
                    break;
                }

                case 'delegate': {
                    const agente = prompt('Agente asignado:');
                    if (agente === null) return;
                    this._updateItem(btn.dataset.id, { estado: 'DELEGADO', agente_asignado: agente });
                    this._closeDetail();
                    break;
                }

                case 'snooze': {
                    const horas = parseInt(prompt('Reactivar en N horas:', '24'), 10);
                    if (isNaN(horas)) return;
                    const ts = new Date(Date.now() + horas * 3600000);
                    this._updateItem(btn.dataset.id, { estado: 'SNOOZED', fecha_reactivacion: ts });
                    this._closeDetail();
                    break;
                }

                case 'toggle-creator':
                    this.#showCreator = !this.#showCreator;
                    this._renderCreator();
                    break;

                case 'submit-item':
                    this._createItem();
                    break;
            }
        });

        // Cambio de selector de vertical (change event)
        this.addEventListener('change', (e) => {
            if (e.target.dataset.action === 'filter-vertical') {
                this.#filterVertical = e.target.value;
                this._renderList();
            }
        });
    }

    // [SEC-04h] _updateItem / _createItem — escrituras Firestore
    async _updateItem(id, fields) {
        if (!id) return;
        try {
            const db = getFirestore();
            await updateDoc(doc(db, 'breederhub_items', id), {
                ...fields,
                fecha_actualizacion: serverTimestamp()
            });
        } catch (err) {
            console.error('[crm-breederhub] updateItem error:', err);
        }
    }

    async _createItem() {
        const fields = {};
        this.querySelectorAll('[data-field]').forEach(el => {
            fields[el.dataset.field] = el.value?.trim() || null;
        });

        if (!fields.tipo || !fields.vertical || !fields.titulo || !fields.prioridad || !fields.autonomia) {
            alert('Tipo, vertical, título, prioridad y autonomía son obligatorios.');
            return;
        }

        try {
            const db = getFirestore();
            await addDoc(collection(db, 'breederhub_items'), {
                tipo:              fields.tipo,
                vertical:          fields.vertical,
                eje:               1,
                titulo:            fields.titulo,
                descripcion:       fields.descripcion || '',
                accion_propuesta:  fields.accion_propuesta || null,
                referencia_disco:  fields.referencia_disco || null,
                prioridad:         fields.prioridad,
                autonomia:         fields.autonomia,
                estado:            'PENDIENTE',
                creado_por:        'SENTINEL',
                agente_asignado:   null,
                fecha_creacion:    serverTimestamp(),
                fecha_actualizacion: serverTimestamp(),
                fecha_resolucion:  null,
            });
            this.#showCreator = false;
            this._renderCreator();
        } catch (err) {
            console.error('[crm-breederhub] createItem error:', err);
        }
    }

    // [SEC-04i] _emit — bus canónico de salida
    _emit(name, detail = {}) {
        this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: false, detail }));
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }

    _closeDetail() {
        this.#selectedId = null;
        const detailEl = this.querySelector('[data-bhub-detail]');
        if (detailEl) { detailEl.innerHTML = ''; detailEl.style.display = 'none'; }
        this._renderList();
    }

    _updateBadge() {
        const badge = this.querySelector('[data-bhub-badge]');
        if (badge) badge.textContent = this.#items.length;
    }
}

// ─── [SEC-05] Registro customElements ────────────────────────────────────────

customElements.define('crm-breederhub', CrmBreederhub);
