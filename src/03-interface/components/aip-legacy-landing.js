// ============================================================
// ARCHIVO  : aip-legacy-landing.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-07-11
// PROPÓSITO: Fachada (Adapter) para ORBIT_1_GUEST.
//            Envuelve las secciones nativas de index.html gestionadas
//            por AIPHandler.js, devolviendo el control del ciclo de vida
//            a app-router.js y permitiendo eliminar location.reload().
// ============================================================

// [SEC-01] Importaciones
import { ReactiveElement } from '../base/reactive-element.js';

// [SEC-02] Clase AipLegacyLanding — Web Component
class AipLegacyLanding extends ReactiveElement {

    // [SEC-02a] connectedCallback — Mutaciones de muestra de Landing
    connectedCallback() {
        super.connectedCallback?.();
        // Replica la inversión de _showLegalAttestation() y showCRM()
        document.querySelector('body > header')?.classList.remove('hidden');
        document.querySelector('body > footer')?.classList.remove('hidden');
        document.getElementById('orbit-3')?.classList.remove('hidden');
        document.getElementById('orbit-2-main-content')?.classList.remove('hidden');
        document.getElementById('tab-content-container')?.classList.remove('hidden');

        // Asegura que el CRM esté oculto si venimos de un logout sin reload
        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.add('hidden');
            dashboard.style.cssText = '';
            dashboard.replaceChildren(); // Limpia gadgets SDUI inyectados
        }

        // Restaura grid del chassis si fue mutado por showCRM()
        const chassis = document.querySelector('.aip-chassis');
        if (chassis) chassis.style.gridTemplateColumns = '';

        // Restaura clases de orbit-2 si fueron mutadas
        const orbit2 = document.getElementById('orbit-2');
        if (orbit2) orbit2.className = 'orbit-2 overflow-y-auto p-8 md:p-12 pb-24 border-r border-outline-variant scroll-smooth';

        console.log('[Fachada] <aip-legacy-landing> montada. DOM restaurado a estado Guest.');
    }

    // [SEC-02b] disconnectedCallback — Mutaciones de ocultación
    disconnectedCallback() {
        super.disconnectedCallback?.();
        // Replica el apagón atómico de _showLegalAttestation()
        document.querySelector('body > header')?.classList.add('hidden');
        document.querySelector('body > footer')?.classList.add('hidden');
        document.getElementById('orbit-3')?.classList.add('hidden');
        document.getElementById('orbit-2-main-content')?.classList.add('hidden');
        document.getElementById('tab-content-container')?.classList.add('hidden');

        console.log('[Fachada] <aip-legacy-landing> desmontada.');
    }
}

// [SEC-03] Registro
customElements.define('aip-legacy-landing', AipLegacyLanding);
