/**
 * @file ignition-v13.js
 * @description Bootstrap del Walking Skeleton v1.3.
 * Orquesta el cimiento reactivo (FSM + Store + Router) y lo conecta al DOM.
 *
 * ESTRATEGIA: Este archivo es el Pegamento de Integración — no contiene lógica de negocio.
 * Registra componentes, inicializa el Router, y conduce la FSM a ORBIT_3_LEGAL_ATTESTATION
 * para validar el Walking Skeleton en localhost.
 *
 * Convive con verticals/aip/ignition.js de v1.2.1 durante la transición.
 * Una vez validado el Walking Skeleton, ignition.js será deprecado (Forja 9+).
 *
 * Doctrina R0 (Zero-Trust): Solo la FSM escribe estado — este archivo solo envía eventos.
 * Doctrina R2 (Light DOM): Los componentes registrados aquí no usan Shadow DOM.
 */

import { UserFSM }          from './01-core/app-fsm.js';
import { ComponentRegistry } from './03-interface/register-components.js';
import { AppRouter }         from './03-interface/app-router.js';

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
    // Estado correcto para un visitante en la landing page:
    //   - #v13-shell permanece vacío (sin overlay)
    //   - La landing v1.2.1 opera con normalidad
    //
    // La transición a ORBIT_3_LEGAL_ATTESTATION la dispara el Gatekeeper v1.3 (Forja 8)
    // cuando el servidor valide al usuario y emita ACCESS_GRANTED.
    // Hasta entonces, el FSM v1.3 coexiste silenciosamente con v1.2.1.

    UserFSM.send('NO_SESSION_FOUND');   // BOOT_SEQUENCE → ORBIT_1_GUEST (landing = sin overlay)

    console.log('[Ignition v1.3] Cimiento activo. FSM:', UserFSM.getMachineState());
    // ORBIT_1_GUEST confirmado — #v13-shell vacío, landing visible.
}
