// ============================================================
// ARCHIVO  : aip-legacy-crm.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-07-11
// PROPÓSITO: Fachada (Adapter) para ORBIT_3_CRM_ACTIVE.
//            Encapsula las mutaciones de AIPHandler.showCRM() y garantiza
//            su reversión limpia en disconnectedCallback (punto crítico
//            que causaba el estado "Frankenstein" y obligaba a location.reload()).
// ============================================================

// [SEC-01] Importaciones
import { ReactiveElement } from '../base/reactive-element.js';

// [SEC-02] Clase AipLegacyCrm — Web Component
class AipLegacyCrm extends ReactiveElement {

    // [SEC-02a] connectedCallback — Mutaciones de activación CRM
    connectedCallback() {
        super.connectedCallback?.();
        // Replica exactamente AIPHandler.showCRM() sin dependencia de AIPHandler
        const chassis = document.querySelector('.aip-chassis');
        if (chassis) chassis.style.gridTemplateColumns = '1fr';

        const orbit2 = document.getElementById('orbit-2');
        if (orbit2) orbit2.className = 'overflow-hidden w-full h-full';

        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.cssText = 'display:flex;width:100%;height:100%;';
        }

        console.log('[Fachada] <aip-legacy-crm> montada. DOM configurado para CRM.');
    }

    // [SEC-02b] disconnectedCallback — Reversión exacta (El fix del Frankenstein)
    disconnectedCallback() {
        super.disconnectedCallback?.();

        // 1. Revertir grid del chassis
        const chassis = document.querySelector('.aip-chassis');
        if (chassis) chassis.style.gridTemplateColumns = '';

        // 2. Revertir clases de orbit-2 a su estado original de index.html
        const orbit2 = document.getElementById('orbit-2');
        if (orbit2) {
            orbit2.className = 'orbit-2 overflow-y-auto p-8 md:p-12 pb-24 border-r border-outline-variant scroll-smooth';
        }

        // 3. Ocultar y limpiar el dashboard
        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.add('hidden');
            dashboard.style.cssText = '';
            // Limpiar gadgets SDUI inyectados por AIPHandler para evitar duplicados al relogear
            dashboard.replaceChildren();
        }

        console.log('[Fachada] <aip-legacy-crm> desmontada. DOM revertido, sin residuos inline.');
    }
}

// [SEC-03] Registro
customElements.define('aip-legacy-crm', AipLegacyCrm);
