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
            console.log('[Exit v1.3] LOGOUT_REQUESTED disparado');
            UserFSM.send('LOGOUT_REQUESTED');
        });
    }

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
        const wc = e.detail?.wc ?? [];
        const sdui = { wc: wc.length > 0 ? wc : ['aip-legal-attestation'] };

        console.log('[Bridge v1.3 →] AccessGranted. wc:', sdui.wc);

        UserFSM.send('LOGIN_SUBMITTED');          // ORBIT_1_GUEST → ORBIT_2_GATEKEEPER
        UserFSM.send('ACCESS_GRANTED', sdui);     // ORBIT_2_GATEKEEPER → ORBIT_3_LEGAL_ATTESTATION
        // Router detecta ORBIT_3_LEGAL_ATTESTATION → monta aip-legal-attestation en #v13-shell
    });

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

// ─── Helper: Restaurar DOM v1.2.1 tras rechazo del peaje ──────────────────────────────────
//
// Invierte lo que AIPHandler._showLegalAttestation() hizo al recibir AccessGranted:
//   - Ocultó: body > header, body > footer, #orbit-3, #orbit-2-main-content,
//             #tab-content-container, #landing-view
//   - Mostró: #legal-attestation-gate
//
// Nota: función declarada fuera del bloque if(shell) para que su scope sea limpio.

function _restoreLanding() {
    // Restaurar elementos ocultados por _showLegalAttestation
    document.querySelector('body > header')?.classList.remove('hidden');
    document.querySelector('body > footer')?.classList.remove('hidden');

    ['orbit-3', 'orbit-2-main-content', 'tab-content-container', 'landing-view'].forEach(id => {
        document.getElementById(id)?.classList.remove('hidden');
    });

    // Ocultar la gate v1.2.1 (quedó visible detrás del overlay que ya no existe)
    document.getElementById('legal-attestation-gate')?.classList.add('hidden');

    // Ocultar el dashboard CRM (visible tras showCRM en AIPHandler)
    document.getElementById('crm-dashboard')?.classList.add('hidden');

    // [BACKWARD-COMPAT] Limpiar body.crm-mode al volver a landing
    document.body.classList.remove('crm-mode');

    console.log('[Bridge v1.3] Landing v1.2.1 restaurada.');
}
