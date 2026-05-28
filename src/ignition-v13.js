/**
 * @file ignition-v13.js
 * @description Bootstrap del Walking Skeleton v1.3 + Gatekeeper Bridge.
 *
 * RESPONSABILIDADES:
 *   1. Registrar componentes v1.3 en el ComponentRegistry (lazy).
 *   2. Inicializar AppRouter con el contenedor #v13-shell.
 *   3. Arrancar FSM en ORBIT_1_GUEST (landing limpia, sin overlay).
 *   4. [BRIDGE FORWARD] Escuchar 'Skeleton:Gatekeeper:AccessGranted' (v1.2.1)
 *      y convertirlo en transiciones FSM v1.3.
 *   5. [BRIDGE BACK] Detectar transiciones FSM v1.3 y disparar las llamadas
 *      necesarias para que AIPHandler.js complete el flujo v1.2.1.
 *
 * NOTA DOCTRINAL — dispatchEvent en puente back:
 *   El uso de document.dispatchEvent en §5 es la ÚNICA excepción autorizada al
 *   veto doctrinal. Está marcada [BRIDGE_LEGACY] y sirve exclusivamente para
 *   notificar a AIPHandler.js (FROZEN v18.7) que el peaje legal fue superado.
 *   No es una transición fiduciaria — es un handoff al sistema legacy.
 *   Se elimina en Forja 9+ al migrar AIPHandler.js.
 *
 * Doctrina R0 (Zero-Trust): Solo la FSM escribe estado v1.3.
 * Doctrina R2 (Light DOM): Los componentes registrados aquí no usan Shadow DOM.
 */

import { UserFSM }          from './01-core/app-fsm.js';
import { ComponentRegistry } from './03-interface/register-components.js';
import { AppRouter }         from './03-interface/app-router.js';
import { onStateChange }     from './01-core/app-store.js';

// ─── 1. Registro de componentes v1.3 (carga lazy — solo cuando el Router los necesite) ───

ComponentRegistry.registerLazy(
    'aip-legal-attestation',
    () => import('./03-interface/components/auth/aip-legal-attestation.js')
);

// ─── EXIT COOLDOWN — timestamp de la última salida del CRM (BUG-VAL-EXIT-01) ─────────────
//
// El mock session de AIPHandler re-dispara Skeleton:Gatekeeper:AccessGranted
// inmediatamente después de que _restoreLanding() ejecuta, causando un segundo
// ciclo de atestación (bug "doble esclusa"). Declarado a nivel de módulo para
// ser accesible desde _restoreLanding() (módulo scope) y el listener §4.

let _lastExitTimestamp = 0;

// ─── 2. Inicializar Router con el contenedor exclusivo v1.3 ──────────────────────────────

const shell = document.getElementById('v13-shell');

if (!shell) {
    console.error('[Ignition v1.3] #v13-shell no encontrado en el DOM — Walking Skeleton abortado.');
} else {
    AppRouter.init(shell);

    // ─── 3. Boot FSM: BOOT_SEQUENCE → ORBIT_1_GUEST ──────────────────────────────────────
    //
    // En landing page no hay overlay. El FSM v1.3 coexiste silenciosamente con v1.2.1.
    // El puente (§4) activa la atestación solo cuando el gatekeeper valide al usuario.

    UserFSM.send('NO_SESSION_FOUND');   // BOOT_SEQUENCE → ORBIT_1_GUEST

    console.log('[Ignition v1.3] Cimiento activo — FSM:', UserFSM.getMachineState());

    // ─── EXIT CRM BUTTON (BUG-VAL-04 · DIR-AIP-14) ───────────────────────────────────────
    //
    // Botón fijo #crm-exit-btn (index.html) — oculto por defecto (style="display:none").
    // Visibilidad controlada en §5 onStateChange según estado FSM.
    // Dispara: LOGOUT_REQUESTED → ORBIT_3_CRM_ACTIVE → ORBIT_1_GUEST (resetSession).

    const _exitBtn = document.getElementById('crm-exit-btn');
    if (_exitBtn) {
        _exitBtn.addEventListener('click', () => {
            console.log('[Exit v1.3] LOGOUT_REQUESTED + landing restore');
            UserFSM.send('LOGOUT_REQUESTED');   // FSM: ORBIT_3_CRM_ACTIVE → ORBIT_1_GUEST
            _restoreLanding();                  // DOM: directo, sin esperar onStateChange
        });
    }

    // ─── LIGHT MODE BRIDGE (LM-BRIDGE-01) ────────────────────────────────────────────────
    //
    // AIPHandler (FROZEN v18.7) activa el modo claro con body.classList.toggle('light-mode').
    // El contrato visual v1.3 usa data-theme en <html> para activar light-dark() CSS.
    // Este observer sincroniza ambos sistemas sin tocar AIPHandler.
    //
    // Flujo: body.light-mode ON → html[data-theme="light"]  → light-dark() resuelve light
    //        body.light-mode OFF → html[data-theme="dark"]  → light-dark() resuelve dark

    new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.attributeName === 'class') {
                const isLight = document.body.classList.contains('light-mode');
                document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
                console.log('[LM-Bridge v1.3] data-theme →', document.documentElement.dataset.theme);
            }
        }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // ─── KYC BANNER BRIDGE (KYC-BRIDGE-01) ───────────────────────────────────────────────
    //
    // AIPHandler (FROZEN v18.7) inyecta #kyc-barrier-banner como overlay fijo en
    // document.body (position:fixed; top:0; z-index:100), tapando los headers de
    // las órbitas donde viven los chevrons.
    // Este observer intercepta la inyección y reubica el banner como sticky-header
    // dentro de #crm-orbit-2 (workbench), preservando su visibilidad y liberando los chevrons.
    // Cancela también el margin-top:40px que AIPHandler pone en #crm-dashboard.
    //
    // [BRIDGE_LEGACY] — eliminar en Forja 9+ al migrar AIPHandler.js.

    // Observer persistente — sin disconnect() para sobrevivir a re-entradas al CRM.
    // Guarda de idempotencia: si el banner ya está en orbit-2 (re-fire del mismo mutation
    // record por doble observer), se salta sin actuar.
    new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.id !== 'kyc-barrier-banner') continue;
                if (node.parentElement?.id === 'crm-orbit-2') continue; // ya reubicado

                const target = document.getElementById('crm-orbit-2');
                if (!target) return;

                // Sobrescribir inline style: fixed → sticky dentro de Orbit 2
                node.style.cssText = [
                    'position:sticky', 'top:0', 'z-index:10',
                    'display:flex', 'align-items:center', 'gap:12px',
                    'padding:8px 16px', 'flex-shrink:0',
                    'background:linear-gradient(135deg,rgba(199,162,75,.12),rgba(127,180,255,.06))',
                    'border-bottom:1px solid rgba(193,168,93,.25)',
                ].join(';');

                target.prepend(node);

                // Cancelar el margin-top que AIPHandler puso en el dashboard
                const dashboard = document.getElementById('crm-dashboard');
                if (dashboard) dashboard.style.marginTop = '';

                console.log('[KYC-Bridge v1.3] Banner reubicado en #crm-orbit-2');
            }
        }
    }).observe(document.body, { childList: true });

    // ─── 4. BRIDGE FORWARD: Skeleton:Gatekeeper:AccessGranted → FSM v1.3 ──────────────────
    //
    // AIPHandler.js (FROZEN v18.7) escucha este mismo evento para mostrar su propia
    // attestation gate (v1.2.1). El puente lo lee también (sin interferir) y conduce
    // el FSM v1.3 a ORBIT_3_LEGAL_ATTESTATION, montando aip-legal-attestation
    // en #v13-shell (z-9000) — visible sobre la v1.2.1 gate.
    //
    // El payload `wc` contiene la whitelist SDUI del servidor (ej: ['aip-trinity-layout', ...]).
    // hasValidSDUIPayload guard verifica que wc.length > 0.

    document.addEventListener('Skeleton:Gatekeeper:AccessGranted', (e) => {
        // ── EXIT COOLDOWN GUARD (BUG-VAL-EXIT-01) ────────────────────────────
        // El mock session de AIPHandler re-dispara AccessGranted tras _restoreLanding().
        // Si han pasado menos de 800ms desde el último EXIT, se descarta el evento.
        if (Date.now() - _lastExitTimestamp < 800) {
            console.warn('[Bridge v1.3 →] AccessGranted ignorado — cooldown post-EXIT activo (%dms)', Date.now() - _lastExitTimestamp);
            return;
        }

        const wc = e.detail?.wc ?? [];
        const sdui = { wc: wc.length > 0 ? wc : ['aip-legal-attestation'] };

        console.log('[Bridge v1.3 →] AccessGranted. wc:', sdui.wc);

        UserFSM.send('LOGIN_SUBMITTED');          // ORBIT_1_GUEST → ORBIT_2_GATEKEEPER
        UserFSM.send('ACCESS_GRANTED', sdui);     // ORBIT_2_GATEKEEPER → ORBIT_3_LEGAL_ATTESTATION
        // Router detecta ORBIT_3_LEGAL_ATTESTATION → monta aip-legal-attestation en #v13-shell
    });

    // ─── LANG DROPDOWN BRIDGE (LANG-BRIDGE-01) ───────────────────────────────────────────────
    //
    // El <details id="lang-selector"> en index.html usa backdrop-filter que crea un
    // stacking context independiente en #orbit-3 (landing), impidiendo que el dropdown
    // z-[100] lo supere visualmente aunque la especificidad numérica lo permite.
    // Solución sin tocar AIPHandler: abrir el dropdown colapsa #orbit-3 en landing
    // eliminando .active → el grid Trinity reduce la columna derecha a 0.
    //
    // [BRIDGE_LEGACY] — migrar a router landing en Forja 9+

    const _langSelector = document.getElementById('lang-selector');
    if (_langSelector) {
        _langSelector.addEventListener('toggle', () => {
            if (_langSelector.open) {
                document.getElementById('orbit-3')?.classList.remove('active');
                console.log('[Lang-Bridge v1.3] #orbit-3 colapsado — dropdown abierto');
            }
        });
    }

    // ─── 5. BRIDGE BACK: Transiciones FSM v1.3 → handoff a v1.2.1 ────────────────────────
    //
    // Monitorea cambios de estado para detectar qué hizo el usuario en el overlay v1.3
    // y disparar la acción correspondiente en AIPHandler.js (v1.2.1).

    let _bridgePrevState = null;

    onStateChange(state => {
        const current = state.ui?.fsmState;

        // ── Mostrar / ocultar botón de salida del CRM ─────────────────────────
        if (_exitBtn) {
            _exitBtn.style.display = (current === 'ORBIT_3_CRM_ACTIVE') ? 'block' : 'none';
        }

        if (_bridgePrevState === 'ORBIT_3_LEGAL_ATTESTATION') {

            if (current === 'ORBIT_3_CRM_ACTIVE') {
                // ── Happy Path: usuario aceptó el peaje legal ──────────────────────────
                // #v13-shell está siendo vaciado por el Router en este mismo tick.
                // [BRIDGE_LEGACY] Notificar a AIPHandler.js que active el CRM v1.2.1.
                console.log('[Bridge v1.3 ←] LEGAL_ACCEPTED → activando CRM v1.2.1');
                document.dispatchEvent(new CustomEvent('Skeleton:Legal:Accepted', { bubbles: true }));
                // AIPHandler: oculta #legal-attestation-gate, llama showCRM(_wcPending)

                // [BACKWARD-COMPAT] Activar body.crm-mode para que AIPHandler.js
                // (FROZEN v18.7) y theme-landing.css reciban la paleta CRM correcta.
                // Se elimina en Forja 9+ cuando AIPHandler sea migrado a v1.3.
                document.body.classList.add('crm-mode');
                console.log('[Bridge v1.3 ←] body.crm-mode activado');
            }

            if (current === 'ORBIT_1_GUEST') {
                // ── Rejection Path: usuario rechazó el peaje legal ─────────────────────
                // La FSM ejecutó resetSession (borra auth + ui.allowedComponents).
                // El Router ya limpió #v13-shell. Restaurar el DOM v1.2.1 manualmente,
                // ya que AIPHandler no tiene mecanismo nativo de restauración.
                // (DD-REJECT-LEGACY — eliminar en Forja 9+ al migrar AIPHandler)
                console.log('[Bridge v1.3 ←] LEGAL_REJECTED → restaurando landing v1.2.1');
                _restoreLanding();
            }
        }

        // ── Exit Path: usuario salió del CRM activo ────────────────────────────
        // ORBIT_3_CRM_ACTIVE → ORBIT_1_GUEST via LOGOUT_REQUESTED | SESSION_EXPIRED
        if (_bridgePrevState === 'ORBIT_3_CRM_ACTIVE' && current === 'ORBIT_1_GUEST') {
            console.log('[Bridge v1.3 ←] CRM_EXIT → restaurando landing v1.2.1');
            _restoreLanding();
        }

        _bridgePrevState = current;
    });
}

// ─── Helper: Restaurar DOM v1.2.1 ─────────────────────────────────────────────────────────
//
// Rutas de invocación:
//   A. Exit button click  → directo (ruta primaria — sin esperar FSM async)
//   B. onStateChange      → ORBIT_3_LEGAL_ATTESTATION → ORBIT_1_GUEST (rechazo legal)
//   C. onStateChange      → ORBIT_3_CRM_ACTIVE → ORBIT_1_GUEST (safety net async)
//
// Invierte lo que AIPHandler._showLegalAttestation() hizo al recibir AccessGranted:
//   Ocultó: body > header/footer, #orbit-3, #orbit-2-main-content,
//           #tab-content-container, #landing-view
//   Mostró: #legal-attestation-gate
//   AIPHandler.showCRM() además mostró #crm-dashboard y añadió margin-top al mismo.
//
// Idempotente — seguro ante llamadas múltiples por rutas A+C en paralelo.

function _restoreLanding() {
    // ── EXIT COOLDOWN STAMP (BUG-VAL-EXIT-01) ─────────────────────────────
    // Marca el timestamp de esta salida. El Bridge Forward §4 rechazará cualquier
    // AccessGranted que llegue en los próximos 800ms (re-fire del mock session).
    _lastExitTimestamp = Date.now();

    // ── #v13-shell force-clear (safety net de timing del Router) ──────────
    // El Router limpia #v13-shell asincrónicamente al cambiar de estado FSM.
    // En el path de EXIT puede haber un frame donde aip-legal-attestation sigue
    // renderizado mientras el DOM landing ya es visible → estado Frankenstein.
    // Este clear síncrono garantiza que #v13-shell esté vacío antes de que
    // landing elements aparezcan.
    const _v13shell = document.getElementById('v13-shell');
    if (_v13shell) _v13shell.innerHTML = '';

    // Restaurar elementos ocultados por _showLegalAttestation
    document.querySelector('body > header')?.classList.remove('hidden');
    document.querySelector('body > footer')?.classList.remove('hidden');

    ['orbit-3', 'orbit-2-main-content', 'tab-content-container', 'landing-view'].forEach(id => {
        document.getElementById(id)?.classList.remove('hidden');
    });

    // Ocultar la gate v1.2.1 (quedó visible detrás del overlay que ya no existe)
    document.getElementById('legal-attestation-gate')?.classList.add('hidden');

    // CRM dashboard: ocultar + limpiar inline styles dejados por AIPHandler
    // (marginTop: 40px y posibles display:block que no ceden al classList.add('hidden'))
    const _dashboard = document.getElementById('crm-dashboard');
    if (_dashboard) {
        _dashboard.classList.add('hidden');
        _dashboard.style.marginTop = '';
        _dashboard.style.display   = '';
    }

    // KYC banner: eliminar del DOM para que el observer re-arme en la próxima entrada
    document.getElementById('kyc-barrier-banner')?.remove();

    // [BACKWARD-COMPAT] Limpiar body.crm-mode al volver a landing
    document.body.classList.remove('crm-mode');

    console.log('[Bridge v1.3] Landing v1.2.1 restaurada.');
}
