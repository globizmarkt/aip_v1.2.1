/**
 * @file app-router.js
 * @description Router reactivo AIP v1.3.
 * Observa state.ui.fsmState (espejo del nodo FSM en el Store) y monta/desmonta
 * el Web Component correcto en el contenedor asignado.
 *
 * Doctrina R0 (Zero-Trust): Solo LEER estado — nunca escribirlo directamente.
 * La única forma de cambiar la vista es que la FSM transite de nodo.
 * Doctrina R2 (Light DOM): Los componentes montados aquí no usan Shadow DOM.
 *
 * Estrategia Walking Skeleton: ORBIT_3_LEGAL_ATTESTATION es el primer nodo visible.
 * Los demás nodos se mapearán en Forjas posteriores conforme se forjen los componentes.
 */

import { onStateChange } from '../01-core/app-store.js';
import { ComponentRegistry } from './register-components.js';

/**
 * Mapa FSM → tag del Web Component que debe renderizarse en ese estado.
 * null = estado transitorio o sin componente v1.3 asignado todavía.
 */
const FSM_VIEW_MAP = Object.freeze({
    'BOOT_SEQUENCE':             null,                    // Arranque — sin vista
    'ORBIT_1_GUEST':             'aip-legacy-landing',    // ✅ Fachada Adapter (DES-11.01)
    'ORBIT_2_GATEKEEPER':        null,                    // Transitorio — servidor valida
    'ORBIT_3_LEGAL_ATTESTATION': 'aip-legal-attestation', // ✅ Forja 5 — operativo
    'ORBIT_3_CRM_ACTIVE':        'aip-legacy-crm',        // ✅ Fachada Adapter (DES-11.01)
    'ACCESS_BLOCKED':            null,                    // Forja futura
});

export const AppRouter = {
    /** @type {HTMLElement|null} */
    _container: null,
    /** @type {string|null} */
    _currentFsmState: null,
    /** @type {function|null} */
    _unsubscribe: null,

    /**
     * Inicializa el router con el contenedor DOM donde se montarán los componentes.
     * A partir de este momento el contenedor es propiedad exclusiva del Router.
     * @param {HTMLElement} container
     */
    init(container) {
        if (!container) {
            console.error('[Router v1.3] Contenedor no encontrado — init abortado.');
            return;
        }
        this._container = container;

        this._unsubscribe = onStateChange(state => {
            this._render(state.ui?.fsmState);
        });

        console.log('[Router v1.3] Inicializado. Esperando transiciones FSM...');
    },

    /**
     * Desmonta el router y limpia la suscripción al store.
     */
    destroy() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
        if (this._container) {
            this._container.replaceChildren();
        }
        this._currentFsmState = null;
        console.log('[Router v1.3] Destruido.');
    },

    /**
     * Renderiza el componente asignado al estado FSM dado.
     * Idempotente: si el estado no cambió, no hace nada.
     * @param {string|undefined} fsmState
     */
    async _render(fsmState) {
        if (!fsmState || fsmState === this._currentFsmState) return;

        const tag = FSM_VIEW_MAP[fsmState];
        this._currentFsmState = fsmState;

        console.log(`[Router v1.3] ${fsmState} → <${tag ?? 'vacío'}>`);

        if (!tag) {
            // Estado sin componente v1.3: limpiar el contenedor
            this._container.replaceChildren();
            return;
        }

        try {
            await ComponentRegistry.ensureDefined(tag);
            const el = document.createElement(tag);
            this._container.replaceChildren(el);
        } catch (err) {
            console.error(`[Router v1.3] Error montando <${tag}>:`, err);
            // [FE-UI-01] Estado de error visible — evitar pantalla en blanco silenciosa
            const errEl = document.createElement('p');
            errEl.className = 'v13-load-error';
            errEl.setAttribute('data-i18n', 'system.component_load_error');
            errEl.textContent = '—';
            this._container.replaceChildren(errEl);
        }
    }
};
