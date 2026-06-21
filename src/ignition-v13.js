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
import { KYCFlowController } from './03-interface/components/kyc/kyc-flow-controller.js';
import { getAuth, signOut }  from 'firebase/auth'; // [SEC-AIP-03] Guard auth real en Bridge Forward / [DBG-BUG-VAL-EXIT-01] signOut antes de reload

// ─── 1. Registro de componentes v1.3 (carga lazy — solo cuando el Router los necesite) ───

ComponentRegistry.registerLazy(
    'aip-legal-attestation',
    () => import('./03-interface/components/auth/aip-legal-attestation.js')
);

ComponentRegistry.registerLazy(
    'aip-document-upload',
    () => import('./gadgets/aip-document-upload.js')
);

ComponentRegistry.registerLazy(
    'aip-cis-form',
    () => import('./gadgets/aip-cis-form.js')
);

ComponentRegistry.registerLazy(
    'aip-aimon-panel',
    () => import('./gadgets/aip-aimon-panel.js')
);

// ─── 1bis. Registro pipeline KYC (Fase 0→4) — yacimiento [N-34] ORB4-KYC ──────────────────
//
// DIR-AIP-04 (validado por el Director 2026-06-14): los 6 componentes
// permanecen en components/kyc/, registrados aquí con el mismo patrón
// registerLazy de §1. El encadenamiento Fase 0→4 lo orquesta
// kyc-flow-controller.js (componentes/kyc/) — su .init(container) requiere
// un punto de montaje dedicado todavía no existente en index.html
// (ver ORB4-MOUNT-01, 00_master_tasks.md §2/§3).

ComponentRegistry.registerLazy(
    'aip-kyc-setup',
    () => import('./03-interface/components/kyc/aip-kyc-setup.js')
);

ComponentRegistry.registerLazy(
    'aip-acp-flow',
    () => import('./03-interface/components/kyc/aip-acp-flow.js')
);

ComponentRegistry.registerLazy(
    'aip-kyc-individual',
    () => import('./03-interface/components/kyc/aip-kyc-individual.js')
);

ComponentRegistry.registerLazy(
    'aip-kyb-flow',
    () => import('./03-interface/components/kyc/aip-kyb-flow.js')
);

ComponentRegistry.registerLazy(
    'aip-l4-qualifier',
    () => import('./03-interface/components/kyc/aip-l4-qualifier.js')
);

ComponentRegistry.registerLazy(
    'aip-superadmin-kyc',
    () => import('./03-interface/components/kyc/aip-superadmin-kyc.js')
);

ComponentRegistry.registerLazy(
    'aip-account-config',
    () => import('./03-interface/components/kyc/aip-account-config.js')
);

ComponentRegistry.registerLazy(
    'aip-agent-desktop',
    () => import('./03-interface/components/kyc/aip-agent-desktop.js')
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
        // ── [SEC-AIP-03] FIREBASE AUTH GUARD ─────────────────────────────────
        // El evento es spoofeable desde consola (dispatchEvent). Verificar que
        // existe sesión Firebase real antes de avanzar el FSM.
        const _auth = getAuth();
        if (!_auth.currentUser) {
            console.warn('[Bridge v1.3 →] AccessGranted rechazado — sin sesión Firebase autenticada.');
            return;
        }

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
        // [VR-B2-01] Suprimir attestation gate v1.2.1 — v1.3 toma el control del peaje legal
        document.getElementById('legal-attestation-gate')?.classList.add('hidden');
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

// ─── 6. ÓRBITA 4 KYC — bridge forward para kyc-flow-controller / aip-superadmin-kyc ───────
//
// Yacimiento [N-34] / ORB4-MOUNT-01. Monta en #orb4-kyc-shell:
//   - AIP:KYC:FlowRequested  → arranca el pipeline aplicante (Fase 0→4) vía
//     KYCFlowController, que encadena los 5 componentes ORB4-KYC-01..05.
//   - AIP:Admin:OpenOrbit4   → monta <aip-superadmin-kyc> (panel SuperAdmin).
//   - AIP:Admin:KYCActionDone (emitido por aip-superadmin-kyc tras
//     aprobar/rechazar) → ANEXO R-GADGET-01.1 punto 7: el componente recarga
//     su propia cola (_loadAudit/_loadUser); este listener solo confirma la
//     recepción para trazabilidad.
//
// Disparo del perfil "Agente" (ORB4-TRIGGER-01) → ver bloque §7 más abajo.
// Disparo de AIP:Admin:OpenOrbit4 (nav SuperAdmin) sigue pendiente — no existe
// aún el nav SuperAdmin en index.html (registrado en ORB4-TRIGGER-01).

const _orb4Shell = document.getElementById('orb4-kyc-shell');

if (!_orb4Shell) {
    console.error('[Ignition v1.3] #orb4-kyc-shell no encontrado — Órbita 4 KYC abortada.');
} else {
    document.addEventListener('AIP:KYC:FlowRequested', () => {
        console.log('[Ignition v1.3] AIP:KYC:FlowRequested → KYCFlowController.init()');
        KYCFlowController.init(_orb4Shell);
    });

    document.addEventListener('AIP:KYC:FlowComplete', () => {
        console.log('[Ignition v1.3] AIP:KYC:FlowComplete → liberando #orb4-kyc-shell');
        KYCFlowController.destroy();
    });

    document.addEventListener('AIP:Admin:OpenOrbit4', async () => {
        console.log('[Ignition v1.3] AIP:Admin:OpenOrbit4 → montando <aip-superadmin-kyc>');
        await ComponentRegistry.ensureDefined('aip-superadmin-kyc');
        const el = document.createElement('aip-superadmin-kyc');
        _orb4Shell.replaceChildren(el);
    });

    document.addEventListener('AIP:Admin:KYCActionDone', (e) => {
        console.log('[Ignition v1.3] AIP:Admin:KYCActionDone recibido:', e.detail);
    });
}

// ─── 7. ÓRBITA 4 — disparo de bootstrap KYC tras signup (ORB4-TRIGGER-01) ──────────────────
//
// DESACTIVADO 2026-06-17 (VIBE-AIP-S-REBORN-08): el KYC se inicia desde dentro
// del CRM — el usuario entra al CRM con el banner de AIPHandler y avanza el KYC
// desde allí. El auto-disparo en login bloqueaba la entrada al CRM con un overlay
// full-screen negro antes de que el usuario pudiera hacer nada.
// El trigger canónico es ORB4-APPINTENT-01 (§8) + botón dentro del CRM.

// ─── 8. ÓRBITA 4 — trigger dual "app-intent" (ORB4-APPINTENT-01, DOMAIN_BLUEPRINT_04 §B3) ──
//
// Yacimiento [N-34]. Implementa el trigger canónico sellado en
// DOMAIN_BLUEPRINT_04_CRM_SHELL.md §B3 — lógica dual:
//   - Contextual (principal): Órbita 2, mandato abierto → app-intent con
//     mandate_id precargado. Se rastrea vía Skeleton:Action:MandateSelected
//     (ya emitido por index.html al seleccionar mandato).
//   - Global de emergencia (failsafe): footer de Órbita 1, #orb4-appintent-btn
//     → app-intent con mandate_id: null si no hay mandato seleccionado.
//
// app-intent reabre #orb4-kyc-shell vía KYCFlowController — de momento monta
// siempre el pipeline KYC (única "app" de Órbita 4 implementada). El "app
// picker" (KYC / VDR-uploader / SuperAdmin según mandate_id y rol) es deuda
// técnica para cuando exista más de una app montable — no se construye un
// picker para una sola opción (R-RSI-01 criterio-guillotina).

{
    let _lastMandateId = null;

    document.addEventListener('Skeleton:Action:MandateSelected', (e) => {
        _lastMandateId = e.detail?.mandateId || e.detail?.id || null;
    });

    document.getElementById('orb4-appintent-btn')?.addEventListener('click', () => {
        console.log(`[Ignition v1.3][ORB4-APPINTENT-01] footer Órbita 1 → app-intent (mandate_id=${_lastMandateId})`);
        document.dispatchEvent(new CustomEvent('app-intent', {
            bubbles: true,
            detail: { mandate_id: _lastMandateId }
        }));
    });

    document.addEventListener('app-intent', (e) => {
        console.log('[Ignition v1.3][ORB4-APPINTENT-01] app-intent recibido:', e.detail);
        // Router de "apps" de Órbita 4 por intent (R-RSI-01 criterio-guillotina:
        // picker real solo cuando exista más de una app montable). Por defecto
        // (sin intent o intent==='kyc') → pipeline KYC, única app implementada
        // hoy. intent==='account-config' (ORB4-ACCOUNTCONFIG-01, ver §9) →
        // evento dedicado, aún sin componente que lo escuche.
        const intent = e.detail?.intent || 'kyc';
        if (intent === 'account-config') {
            document.dispatchEvent(new CustomEvent('AIP:Config:OpenRequested', { bubbles: true, detail: e.detail }));
        } else {
            document.dispatchEvent(new CustomEvent('AIP:KYC:FlowRequested', { bubbles: true }));
        }
    });
}

// ─── 9. ÓRBITA 4 — "Configuración de cuenta" desde footer CRM de Órbita 1 (ORB4-ACCOUNTCONFIG-01) ──
//
// Yacimiento [N-34]. Corrección 2026-06-14 (Director, "C."): el acceso real a
// Órbita 4 documentado por el Director es DENTRO del CRM, vía el footer de
// Órbita 1 (`aip-trinity-layout.js` [SEC inline], botón
// data-action="OpenUserConfig" → "Configuración de cuenta" — ya presente en el
// marcado, sin cablear hasta ahora). Este botón es un TERCER punto de entrada a
// Órbita 4, distinto y complementario a los dos de §B3/§8
// (contextual-mandato y emergencia-footer-landing).
//
// UIBinder traduce el click en Skeleton:RequestGate{action:'OpenUserConfig'} →
// Router (sin entrada en SEMANTIC_MAP) → passthrough Skeleton:Action:OpenUserConfig.
// Aquí se traduce a app-intent{intent:'account-config', mandate_id:null}, que
// §8 enruta a AIP:Config:OpenRequested.
//
// RESUELTO (ORB4-ACCOUNTCONFIG-01, 2026-06-15): la "pieza" — componente
// <aip-account-config> que escucha AIP:Config:OpenRequested y monta el panel
// de configuración de cuenta (nombre de usuario, renovación de contraseña,
// selección de timeframe + gate "Administradores y Personal AIP" que dispara
// AIP:Admin:OpenOrbit4) — ver §10.

document.addEventListener('Skeleton:Action:OpenUserConfig', () => {
    console.log('[Ignition v1.3][ORB4-ACCOUNTCONFIG-01] footer CRM Órbita 1 "Configuración de cuenta" → app-intent(account-config)');
    document.dispatchEvent(new CustomEvent('app-intent', {
        bubbles: true,
        detail: { mandate_id: null, intent: 'account-config' }
    }));
});

// ─── 10. ÓRBITA 4 — panel de configuración de cuenta (ORB4-ACCOUNTCONFIG-01) ───────────────
//
// Yacimiento [N-34]. Monta/desmonta <aip-account-config> en #orb4-kyc-shell:
//   - AIP:Config:OpenRequested  → monta <aip-account-config> (perfil, seguridad,
//     timeframe + gate SuperAdmin → AIP:Admin:OpenOrbit4, §6).
//   - AIP:Config:CloseRequested → libera #orb4-kyc-shell (botón "✕" del panel).
//
// El botón "← Volver" de <aip-superadmin-kyc> (R-GADGET-01 bisturí funcional)
// dispara AIP:Config:OpenRequested para regresar a este panel.

{
    // [P0-ARCH-03] §10 y §11 reutilizan _orb4Shell declarado en §6 — única referencia al nodo

    document.addEventListener('AIP:Config:OpenRequested', async () => {
        console.log('[Ignition v1.3][ORB4-ACCOUNTCONFIG-01] AIP:Config:OpenRequested → montando <aip-account-config>');
        if (!_orb4Shell) return;
        await ComponentRegistry.ensureDefined('aip-account-config');
        const el = document.createElement('aip-account-config');
        _orb4Shell.replaceChildren(el);
    });

    document.addEventListener('AIP:Config:CloseRequested', () => {
        console.log('[Ignition v1.3][ORB4-ACCOUNTCONFIG-01] AIP:Config:CloseRequested → liberando #orb4-kyc-shell');
        _orb4Shell?.replaceChildren();
    });
}

// ─── 11. ÓRBITA 4 — Desktop del Agente (ORB4-DESKTOP-AGENTE-01) ────────────────────────────
//
// Yacimiento [N-34]. Monta/desmonta <aip-agent-desktop> en #orb4-kyc-shell:
//   - AIP:Agent:OpenRequested  → monta <aip-agent-desktop> (gate rol 'agente',
//     sección "Mis Documentos" — subir/listar/descargar/eliminar).
//   - AIP:Agent:CloseRequested → libera #orb4-kyc-shell.
//
// El botón "← Volver" de <aip-agent-desktop> (R-GADGET-01 bisturí funcional)
// dispara AIP:Config:OpenRequested para regresar al panel de configuración.

{
    // [P0-ARCH-03] Reutiliza _orb4Shell declarado en §6 — sin nueva referencia al nodo

    document.addEventListener('AIP:Agent:OpenRequested', async () => {
        console.log('[Ignition v1.3][ORB4-DESKTOP-AGENTE-01] AIP:Agent:OpenRequested → montando <aip-agent-desktop>');
        if (!_orb4Shell) return;
        await ComponentRegistry.ensureDefined('aip-agent-desktop');
        const el = document.createElement('aip-agent-desktop');
        _orb4Shell.replaceChildren(el);
    });

    document.addEventListener('AIP:Agent:CloseRequested', () => {
        console.log('[Ignition v1.3][ORB4-DESKTOP-AGENTE-01] AIP:Agent:CloseRequested → liberando #orb4-kyc-shell');
        _orb4Shell?.replaceChildren();
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
    // ── EXIT: reload limpio ────────────────────────────────────────────────────
    //
    // DIAGNÓSTICO (Rondas 3 y 4): la inversión manual de mutaciones DOM de
    // AIPHandler (FROZEN v18.7) es estructuralmente incompleta — AIPHandler es
    // una caja negra que toca clases, estilos inline, aria-attrs y estado interno
    // que no tenemos mapeado. Cada ronda de validación expone una mutación nueva.
    //
    // SOLUCIÓN FIDUCIARIA: location.reload() garantiza:
    //   · DOM virgen — cero arrastre de estado AIPHandler
    //   · FSM v1.3 arranca fresco en ORBIT_1_GUEST
    //   · Bridges re-inicializan limpios
    //   · Cero posibilidad de estado Frankenstein
    //
    // El cooldown guard (_lastExitTimestamp) se resetea con el módulo en el
    // nuevo load — no hay riesgo de doble-esclusa porque AIPHandler también
    // arranca fresco y no re-dispara AccessGranted sin interacción del usuario.
    //
    // [FORJA-9+] Si en el futuro se necesita SPA-exit sin reload, implementar
    // AIPHandler.resetToLanding() y llamarlo aquí. Por ahora, reload es correcto.

    // [DBG-BUG-VAL-EXIT-01] CAUSA RAÍZ: onAuthStateChanged re-dispara AccessGranted
    // en el nuevo load si la sesión Firebase no fue cerrada antes del reload.
    // El cooldown guard (_lastExitTimestamp) se resetea con el módulo → siempre bypaseado.
    // Solución: signOut() limpia la sesión Firebase → onAuthStateChanged(null) post-reload.
    console.log('[Bridge v1.3] EXIT → signOut() + location.reload() — landing virgen.');
    signOut(getAuth()).finally(() => location.reload());
}
