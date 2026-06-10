// ============================================================
// ARCHIVO  : aip-aimon-panel.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-08
// PROPÓSITO: Web Component AIMON — Panel de monitoreo de mandatos
//            para superadmin. Vista en tiempo real del estado de
//            todos los mandatos, fases y alertas de acción pendiente.
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — CSS (R3 Zero-Hex)
// [SEC-03] Clase AipAimonPanel — Web Component
//   [SEC-03a] Campos privados + lifecycle
//   [SEC-03b] stateChanged — reactividad al store
//   [SEC-03c] _render — construcción del panel
//   [SEC-03d] _wire — event delegation
//   [SEC-03e] Helpers (derivación de dominio, KPIs)
//   [SEC-03f] static mount — API pública
// [SEC-04] Registro

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): solo CSS variables de crm-tokens-v13.css
//   R20 (Event-Driven): bus canónico CustomEvents en document
//   R25 (Sensores ciegos): sin lógica de negocio en la vista
//   DT-AIP-05 (XSS Zero-Trust): textContent, nunca innerHTML con datos externos
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones y dependencias
import { ReactiveElement } from '../03-interface/base/reactive-element.js';
import { mockState } from '../verticals/aip/mockState.js';

// [SEC-02] Constantes — CSS (R3 Zero-Hex: solo CSS variables)
const AIMON_PANEL_STYLES = `
<style id="aimon-panel-styles">
    aip-aimon-panel {
        --aimon-warn-bg:     color-mix(in srgb, var(--crm-warning)  5%, transparent);
        --aimon-warn-border: color-mix(in srgb, var(--crm-warning) 20%, transparent);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        background: var(--crm-canvas);
        color: var(--crm-text-primary);
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 13px;
    }

    .aimon-topbar {
        height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
        padding: 0 24px; background: var(--crm-abyss); border-bottom: 1px solid var(--crm-border);
    }
    .aimon-kpi-row {
        display: flex; gap: 16px; padding: 16px 24px; background: var(--crm-surface); border-bottom: 1px solid var(--crm-border);
    }
    .aimon-kpi-cell {
        flex: 1; padding: 12px; background: var(--crm-abyss); border: 1px solid var(--crm-border);
    }
    .aimon-kpi-label { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--crm-text-secondary); margin-bottom: 4px; }
    .aimon-kpi-value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; color: var(--crm-accent); }
    .aimon-kpi-value.warn { color: var(--crm-warning); }

    .aimon-list { flex: 1; overflow-y: auto; }
    .aimon-list-header {
        height: 32px; display: flex; align-items: center; gap: 16px; padding: 0 24px;
        background: var(--crm-surface); border-bottom: 1px solid var(--crm-border); position: sticky; top: 0; z-index: 10;
    }
    .aimon-row {
        display: flex; align-items: center; gap: 16px; padding: 14px 24px;
        border-bottom: 1px solid var(--crm-border); cursor: pointer; background: var(--crm-canvas);
        transition: background 150ms ease;
    }
    .aimon-row:hover { background: color-mix(in srgb, var(--crm-text-primary) 2%, var(--crm-canvas)); }
    .aimon-row.locked { opacity: 0.4; pointer-events: none; }

    .aimon-col-id { width: 140px; flex-shrink: 0; }
    .aimon-col-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .aimon-col-domain { width: 120px; flex-shrink: 0; text-align: center; }
    .aimon-col-phase { width: 120px; flex-shrink: 0; text-align: center; }
    .aimon-col-users { width: 80px; flex-shrink: 0; text-align: right; }

    .label-xs { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--crm-text-secondary); }
    .label-sm { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .ghost { color: var(--crm-text-secondary); }

    .badge { display: inline-flex; align-items: center; padding: 2px 7px; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid; }
    .badge--accent { color: var(--crm-accent); border-color: color-mix(in srgb, var(--crm-accent) 35%, transparent); background: color-mix(in srgb, var(--crm-accent) 6%, transparent); }
    .badge--warning { color: var(--crm-warning); border-color: color-mix(in srgb, var(--crm-warning) 35%, transparent); background: color-mix(in srgb, var(--crm-warning) 6%, transparent); }
    .badge--ghost { color: var(--crm-text-secondary); border-color: color-mix(in srgb, var(--crm-text-secondary) 35%, transparent); background: color-mix(in srgb, var(--crm-text-secondary) 6%, transparent); }
</style>
`;

// [SEC-03] Clase AipAimonPanel — Web Component
class AipAimonPanel extends ReactiveElement {

    // [SEC-03a] Campos privados + lifecycle
    #rendered = false;

    connectedCallback() {
        super.connectedCallback();

        const clearance = window.Skeleton?.store?.getState()?.user?.clearance;
        if (clearance !== 'superadmin') {
            this.textContent = 'Acceso restringido';
            return;
        }

        if (!this.#rendered) {
            this._render();
            this._wire();
            this.#rendered = true;
        }
    }

    // [SEC-03b] stateChanged — reactividad al store
    stateChanged(state) {
        if (!this.#rendered) return;
        this._render();
        this._wire();
    }

    // [SEC-03c] _render — construcción del panel
    _render() {
        const mandates = mockState.mandates;
        const kpis = this._calculateKPIs(mandates);

        // DT-AIP-05: innerHTML permitido solo para estructura estática y estilos
        this.innerHTML = `
${AIMON_PANEL_STYLES}
<header class="aimon-topbar">
    <div style="display:flex;align-items:center;gap:12px;">
        <span class="label-sm" style="color:var(--crm-accent);">AIMON</span>
        <span class="label-xs ghost">PANEL DE MONITOREO</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--crm-success);"></span>
        <span class="label-xs" style="color:var(--crm-success);">LIVE</span>
    </div>
</header>
<div class="aimon-kpi-row">
    <div class="aimon-kpi-cell">
        <div class="aimon-kpi-label">MANDATOS ACTIVOS</div>
        <div class="aimon-kpi-value">${kpis.active}</div>
    </div>
    <div class="aimon-kpi-cell">
        <div class="aimon-kpi-label">INVERSORES EN PROCESO</div>
        <div class="aimon-kpi-value">${kpis.investors}</div>
    </div>
    <div class="aimon-kpi-cell">
        <div class="aimon-kpi-label">ALERTAS PENDIENTES</div>
        <div class="aimon-kpi-value ${kpis.alerts > 0 ? 'warn' : ''}">${kpis.alerts}</div>
    </div>
</div>
<div class="aimon-list">
    <div class="aimon-list-header">
        <span class="label-xs ghost aimon-col-id">MANDATE ID</span>
        <span class="label-xs ghost aimon-col-name">NOMBRE / ESPECIFICACIÓN</span>
        <span class="label-xs ghost aimon-col-domain">DOMINIO</span>
        <span class="label-xs ghost aimon-col-phase">FASE ACTUAL</span>
        <span class="label-xs ghost aimon-col-users">USUARIOS</span>
    </div>
    <div id="aimon-mandates-container"></div>
</div>
        `;

        const container = this.querySelector('#aimon-mandates-container');
        if (!container) return;

        // DT-AIP-05: datos de mandatos inyectados con createElement + textContent
        mandates.forEach(mandate => {
            const row = document.createElement('div');
            row.className = `aimon-row${mandate.locked ? ' locked' : ''}`;
            if (!mandate.locked) {
                row.dataset.mandateId = mandate.mandateId;
            }

            const colId = document.createElement('div');
            colId.className = 'aimon-col-id mono';
            colId.style.fontSize = '10px';
            colId.textContent = mandate.mandateId ?? '—';

            const colName = document.createElement('div');
            colName.className = 'aimon-col-name';
            colName.style.fontSize = '11px';
            colName.textContent = mandate.asset?.spec ?? mandate.asset?.class ?? mandate.type ?? '—';

            const colDomain = document.createElement('div');
            colDomain.className = 'aimon-col-domain';
            colDomain.style.fontSize = '10px';
            colDomain.textContent = this._getDomain(mandate.mandateId);

            const colPhase = document.createElement('div');
            colPhase.className = 'aimon-col-phase';
            const phaseBadge = document.createElement('span');
            phaseBadge.className = `badge ${this._getPhaseClass(mandate.fiduciaryState)}`;
            phaseBadge.textContent = mandate.fiduciaryState ?? '—';
            colPhase.appendChild(phaseBadge);

            const colUsers = document.createElement('div');
            colUsers.className = 'aimon-col-users mono ghost';
            colUsers.style.fontSize = '11px';
            colUsers.textContent = this._getUsersCount(mandate);

            row.append(colId, colName, colDomain, colPhase, colUsers);
            container.appendChild(row);
        });
    }

    // [SEC-03d] _wire — event delegation
    _wire() {
        this.addEventListener('click', (e) => {
            const row = e.target.closest('.aimon-row[data-mandate-id]');
            if (!row) return;

            const mandateId = row.dataset.mandateId;
            document.dispatchEvent(new CustomEvent('app-intent', {
                bubbles: true,
                detail: { target: 'mandate-detail', mandate_id: mandateId }
            }));
        });
    }

    // [SEC-03e] Helpers
    _calculateKPIs(mandates) {
        const active = mandates.filter(m => !m.locked).length;
        const investors = mandates.reduce((acc, m) => acc + (m.parties?.client ? 1 : 0), 0);
        const alerts = mandates.filter(m => m.locked === false && (!m.compliance?.amlClear || m.compliance?.ncndaSigned === false || m.compliance?.sgsCertificate === null)).length;
        return { active, investors, alerts };
    }

    _getDomain(mandateId) {
        const cats = mockState.categories;
        if (!cats) return '—';
        for (const key of Object.keys(cats)) {
            if (cats[key].mandate_ids?.includes(mandateId)) {
                return cats[key].domain ?? '—';
            }
        }
        return '—';
    }

    _getPhaseClass(phase) {
        if (phase === 'MADURACIÓN' || phase === 'CUALIFICADO' || phase === 'EVALUACIÓN') return 'badge--accent';
        if (phase === 'EMBRIONARIO' || phase === 'GESTACIÓN') return 'badge--warning';
        return 'badge--ghost';
    }

    _getUsersCount(mandate) {
        let count = 0;
        if (mandate.parties?.originator) count++;
        if (mandate.parties?.client) count++;
        if (Array.isArray(mandate.parties?.counterparties)) count += mandate.parties.counterparties.length;
        return count;
    }

    // [SEC-03f] static mount — API pública de montaje
    static mount(container) {
        const el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!el) {
            console.warn('[AimonPanel] mount(): contenedor no encontrado →', container);
            return null;
        }

        const panel = document.createElement('aip-aimon-panel');
        el.replaceChildren(panel);
        console.log('[AimonPanel] Montado en', typeof container === 'string' ? container : (el.id || el.tagName));
        return panel;
    }
}

// [SEC-04] Registro
customElements.define('aip-aimon-panel', AipAimonPanel);

export { AipAimonPanel };
export default AipAimonPanel;
