// ============================================================
// ARCHIVO  : aip-acp-flow.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-02
// PROPÓSITO: Componente Fase 1 — Acuerdo de Confidencialidad de Plataforma (ACP).
//            Acuerdo genérico user ↔ plataforma (NO mandate-specific).
//            4 pasos: Intro → Revisión datos → Espera email → Confirmado.
//            Emite AIP:KYC:ACPConfirmed cuando Firestore confirma acp_confirmed=true.
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Constantes y configuración
// [SEC-03] Stub de envío de email (swap-ready para Cloud Function E6-T02+)
// [SEC-04] Helper DOM — _c() (R32: cero innerHTML, scope de módulo)
// [SEC-05] Clase AipAcpFlow — Web Component
//   [SEC-05a] Campos privados + estado interno
//   [SEC-05b] connectedCallback / disconnectedCallback / stateChanged
//   [SEC-05c] Inicialización de datos de sesión
//   [SEC-05d] Listener Firestore en tiempo real (zero-polling)
//   [SEC-05e] Controladores de paso: Intro → Review → Send → Wait
//   [SEC-05f] Cooldown anti-spam (60s entre reenvíos)
//   [SEC-05g] _render — DOM builder (R32 / R8)
//   [SEC-05h] _emitACPConfirmed — señal canónica de fase completada
// [SEC-06] Registro del custom element

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA ACTIVA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R8  (DOM Mudo): textos vía data-i18n — nunca strings hardcodeados en DOM
//   R19 (Inmutabilidad): nunca borrar datos; onSnapshot desuscrito tras confirmación
//   R32 (XSS Zero-Trust): textContent y createElement — nunca innerHTML con datos
//
// ALINEACIÓN DE CAMPOS state.session (pendiente sinc con PassportEngine real):
//   Mock actual usa: state.session.operador (nombre), state.session.email, etc.
//   Este componente normaliza a: { nombre, email, tipoUsuario, fecha }
//   Cuando PassportEngine.js esté electrificado (E6-T02), revisar mapeo en _initData().
//
// NOTA FIREBASE: imports de 'firebase/auth' y 'firebase/firestore' requieren
//   import map en index.html o SDK modular instalado (pendiente E6-T02).
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones
import { ReactiveElement } from '../../base/reactive-element.js';
import { readState }        from '../../../01-core/app-store.js';
import { getAuth }          from 'firebase/auth';
import {
    getFirestore,
    doc,
    onSnapshot,
} from 'firebase/firestore';

// [SEC-02] Constantes y configuración
const STEP = Object.freeze({ INTRO: 1, REVIEW: 2, WAIT: 3, CONFIRMED: 4 });
const RESEND_COOLDOWN_SECS = 60;

// [SEC-03] Stub de envío de email — swap-ready para Cloud Function
// Cuando E6-T02+ esté disponible, sustituir el body por:
//   const res = await fetch('/api/acp/send', { method: 'POST', body: JSON.stringify({ uid, ...userData }) });
//   if (!res.ok) throw new Error('ACP send failed');
async function sendACPEmail(uid, userData) {
    console.log('[ACP:Stub] Email simulado → uid:', uid, '| email:', userData.email);
    return { ok: true };
}

// [SEC-04] Helper DOM — scope de módulo (no recrear en cada render)
// Función pura: tag + props + children → HTMLElement
// R32: nunca usa innerHTML. Textos via textContent o createTextNode.
function _c(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        switch (k) {
            case 'className':    el.className   = v; break;
            case 'textContent':  el.textContent  = v; break;
            case 'type':         el.type         = v; break;
            case 'name':         el.name         = v; break;
            case 'value':        el.value        = v; break;
            case 'required':     el.required     = v; break;
            case 'disabled':     el.disabled     = v; break;
            case 'readOnly':     el.readOnly     = v; break;
            default:             el.setAttribute(k, v);
        }
    }
    for (const child of children) {
        if (child instanceof Node)     el.appendChild(child);
        else if (child !== null && child !== undefined)
            el.appendChild(document.createTextNode(String(child)));
    }
    return el;
}

// [SEC-05] Clase AipAcpFlow — Web Component
class AipAcpFlow extends ReactiveElement {

    // [SEC-05a] Campos privados
    #step         = STEP.INTRO;
    #loading      = false;
    #error        = '';          // clave i18n del error activo
    #userData     = {};          // nombre, email, tipoUsuario, fecha
    #unsubACP     = null;        // unsubscribe de onSnapshot
    #cooldown     = 0;           // segundos restantes para reenvío
    #cooldownRef  = null;        // ref al setInterval del cooldown

    // [SEC-05b] Lifecycle
    connectedCallback() {
        super.connectedCallback();
        this._initData();
        this._listenFirestore();

        // Si ya está confirmado (sesión retomada), completar sin UI
        const state = readState();
        if (state.session?.acp_confirmed === true) {
            this._emitACPConfirmed();
        } else {
            this._render();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._teardown();
    }

    // Phase 1 no necesita reaccionar al store global — inicialización única en connectedCallback
    stateChanged(_state) { /* intencional — ACP opera sobre Firebase y estado local */ }

    // [SEC-05c] Inicialización de datos de sesión
    // Normaliza los campos del store a la forma que necesita el componente.
    // PENDIENTE: revisar mapeo cuando PassportEngine esté electrificado (E6-T02).
    _initData() {
        const state = readState();
        const auth  = getAuth();
        const s     = state.session ?? {};

        this.#userData = {
            nombre:      s.nombre ?? s.operador ?? auth.currentUser?.displayName ?? '',
            email:       s.email  ?? auth.currentUser?.email ?? '',
            tipoUsuario: s.tipoUsuario ?? s.rol ?? 'investor',
            fecha:       new Date().toLocaleDateString('es-ES'),
        };
    }

    // [SEC-05d] Listener Firestore — zero-polling (R11 conforme)
    _listenFirestore() {
        const uid = getAuth().currentUser?.uid;
        if (!uid) return;

        const userRef = doc(getFirestore(), 'users', uid);

        this.#unsubACP = onSnapshot(userRef, (snap) => {
            if (snap.data()?.acp_confirmed === true) {
                // R19: desconectar tras confirmación — no volvemos a necesitar el listener
                this._teardown();
                this.#step = STEP.CONFIRMED;
                this._render();
                this._emitACPConfirmed();
            }
        }, (err) => {
            console.error('[ACP:Firestore]', err);
        });
    }

    _teardown() {
        if (this.#unsubACP)   { this.#unsubACP(); this.#unsubACP = null; }
        if (this.#cooldownRef){ clearInterval(this.#cooldownRef); this.#cooldownRef = null; }
        this.#cooldown = 0;
    }

    // [SEC-05e] Controladores de paso

    _goToReview(e) {
        e.preventDefault();
        this.#step = STEP.REVIEW;
        this._render();
    }

    async _handleSend(e) {
        e.preventDefault();
        // Capturar nombre editado por el usuario
        const nombre = e.target.elements['nombre']?.value?.trim();
        if (nombre) this.#userData.nombre = nombre;

        this.#loading = true;
        this.#error   = '';
        this._render();

        try {
            await sendACPEmail(getAuth().currentUser?.uid, this.#userData);
            this.#step = STEP.WAIT;
            this._startCooldown();
        } catch (err) {
            console.error('[ACP:Send]', err);
            this.#error = 'acp.error.send_failed';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    async _handleResend(e) {
        e.preventDefault();
        if (this.#cooldown > 0 || this.#loading) return;

        this.#loading = true;
        this.#error   = '';
        this._render();

        try {
            await sendACPEmail(getAuth().currentUser?.uid, this.#userData);
            this._startCooldown();
        } catch (err) {
            console.error('[ACP:Resend]', err);
            this.#error = 'acp.error.resend_failed';
        } finally {
            this.#loading = false;
            this._render();
        }
    }

    // [SEC-05f] Cooldown anti-spam
    _startCooldown() {
        if (this.#cooldownRef) clearInterval(this.#cooldownRef);
        this.#cooldown = RESEND_COOLDOWN_SECS;
        this.#cooldownRef = setInterval(() => {
            this.#cooldown--;
            if (this.#cooldown <= 0) {
                clearInterval(this.#cooldownRef);
                this.#cooldownRef = null;
                this.#cooldown = 0;
            }
            this._render();
        }, 1000);
    }

    // [SEC-05g] _render — DOM builder (R32 / R8)
    _render() {
        while (this.firstChild) this.removeChild(this.firstChild);

        const root = _c('div', { className: 'acp-flow' });

        // Bloque de error — R8: texto vía data-i18n
        if (this.#error) {
            root.appendChild(
                _c('div', { className: 'acp-flow__error', role: 'alert' }, [
                    _c('span', { 'data-i18n': this.#error }),
                ])
            );
        }

        // ── STEP.INTRO ───────────────────────────────────────────────────────
        if (this.#step === STEP.INTRO) {
            const form = _c('form', { className: 'acp-flow__panel' });
            form.addEventListener('submit', this._goToReview.bind(this));
            form.append(
                _c('h2', { 'data-i18n': 'acp.intro.title' }),
                _c('p',  { 'data-i18n': 'acp.intro.desc' }),
                _c('button', { type: 'submit', className: 'aip-btn-primary' }, [
                    _c('span', { 'data-i18n': 'actions.view_data_continue' }),
                ]),
            );
            root.appendChild(form);

        // ── STEP.REVIEW ──────────────────────────────────────────────────────
        } else if (this.#step === STEP.REVIEW) {
            const form = _c('form', { className: 'acp-flow__form' });
            form.addEventListener('submit', this._handleSend.bind(this));
            form.append(
                _c('h2', { 'data-i18n': 'acp.review.title' }),

                // Nombre — editable
                _c('label', { 'data-i18n': 'acp.review.name_label', htmlFor: 'acp-nombre' }),
                _c('input', { id: 'acp-nombre', type: 'text', name: 'nombre',
                    value: this.#userData.nombre, required: true, className: 'aip-input' }),

                // Email — readonly (R32: email del usuario vía .value, no innerHTML)
                _c('label', { 'data-i18n': 'acp.review.email_label', htmlFor: 'acp-email' }),
                _c('input', { id: 'acp-email', type: 'email', name: 'email',
                    value: this.#userData.email, readOnly: true, className: 'aip-input aip-input--readonly' }),

                // Tipo de usuario — readonly
                _c('label', { 'data-i18n': 'acp.review.type_label', htmlFor: 'acp-tipo' }),
                _c('input', { id: 'acp-tipo', type: 'text', name: 'tipo',
                    value: this.#userData.tipoUsuario, readOnly: true, className: 'aip-input aip-input--readonly' }),

                // Fecha — readonly
                _c('label', { 'data-i18n': 'acp.review.date_label', htmlFor: 'acp-fecha' }),
                _c('input', { id: 'acp-fecha', type: 'text', name: 'fecha',
                    value: this.#userData.fecha, readOnly: true, className: 'aip-input aip-input--readonly' }),

                _c('button', { type: 'submit', className: 'aip-btn-primary', disabled: this.#loading }, [
                    _c('span', { 'data-i18n': this.#loading ? 'actions.loading' : 'actions.data_correct_send' }),
                ]),
            );
            root.appendChild(form);

        // ── STEP.WAIT ────────────────────────────────────────────────────────
        } else if (this.#step === STEP.WAIT) {
            const panel = _c('div', { className: 'acp-flow__panel' });

            // Email del usuario vía textContent — R32 conforme
            const emailDisplay = _c('div', { className: 'acp-flow__email' });
            emailDisplay.textContent = this.#userData.email;

            const resendLabel = this.#cooldown > 0
                ? 'actions.resend_cooldown'
                : 'actions.resend_email';

            const resendBtn = _c('button', {
                type: 'button',
                className: 'aip-btn-secondary',
                disabled: this.#cooldown > 0 || this.#loading,
            }, [
                _c('span', { 'data-i18n': resendLabel }),
                ...(this.#cooldown > 0 ? [_c('span', {}, [` (${this.#cooldown}s)`])] : []),
            ]);
            resendBtn.addEventListener('click', this._handleResend.bind(this));

            panel.append(
                _c('h2', { 'data-i18n': 'acp.wait.title' }),
                _c('p',  { 'data-i18n': 'acp.wait.desc_sent' }),
                emailDisplay,
                _c('p',  { 'data-i18n': 'acp.wait.spam_note', className: 'acp-flow__note' }),
                resendBtn,
            );
            root.appendChild(panel);

        // ── STEP.CONFIRMED ───────────────────────────────────────────────────
        } else if (this.#step === STEP.CONFIRMED) {
            root.appendChild(
                _c('div', { className: 'acp-flow__panel acp-flow__panel--success' }, [
                    _c('h2', { 'data-i18n': 'acp.confirmed.title' }),
                    _c('p',  { 'data-i18n': 'acp.confirmed.desc' }),
                ])
            );
        }

        this.appendChild(root);

        // Re-ignición i18n — notifica al sistema que hay DOM nuevo que hidratar
        this.dispatchEvent(new CustomEvent('Skeleton:DOM:Hydrated', {
            bubbles: true,
            detail: { source: 'aip-acp-flow', step: this.#step },
        }));
    }

    // [SEC-05h] _emitACPConfirmed — señal canónica de fase completada
    _emitACPConfirmed() {
        this.dispatchEvent(new CustomEvent('AIP:KYC:ACPConfirmed', { bubbles: true }));
    }
}

// [SEC-06] Registro del custom element
customElements.define('aip-acp-flow', AipAcpFlow);
