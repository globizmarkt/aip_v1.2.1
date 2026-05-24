// ============================================================
// ARCHIVO  : GenesisWizard.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-24
// PROPÓSITO: Controlador de la Esclusa del Golden Gate (Airlock).
//            Implementa el Acto I del DOMAIN_BLUEPRINT_01.md:
//            Visita Anónima → Fricción Estética → Mochila EMBRYONIC → Cruce al CRM.
//            La fricción aquí es psicológica/educativa, NO operativa.
//            El KYC real ocurre dentro del CRM (Épica 4+).
// ============================================================
// ÉPICA    : E3 — Onboarding Spine
// TICKET   : E3-T01
// AGENTE   : Claude Code
// DOCTRINA : R20 (Event-Driven) · R18 (ES Modules) · R14 (Fricción deliberada — estética)
//            R25 (Zero-DOM — acceso DOM solo en init y handlers)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Constantes y estado interno
// [SEC-03] Máquina de estados del botón (Sovereign Confirm)
// [SEC-04] Ceremonia asíncrona (Theater of Security)
// [SEC-05] Módulo GenesisWizard (init)
// [SEC-06] Export

// ============================================================
// [SEC-01] Importaciones
// ============================================================

import { createEmptyState } from '../../01-core/schemas/AnonProjectState.js';

// ============================================================
// [SEC-02] Constantes y estado interno
// ============================================================

const ANON_PROJECT_KEY  = 'AnonProjectState';
const ARMING_TIMEOUT_MS = 5_000;   // El usuario tiene 5s para confirmar tras el primer click
const CEREMONY_STEP_MS  = 900;     // Cada paso del teatro: 900ms × 3 = 2700ms total

const WIZARD_STATE = Object.freeze({
    IDLE:      'IDLE',      // Botón en reposo — texto canónico
    ARMING:    'ARMING',    // Click 1 recibido — esperando confirmación
    EXECUTING: 'EXECUTING', // Click 2 confirmado — ceremonia en curso
});

let _state     = WIZARD_STATE.IDLE;
let _armTimer  = null;
let _btn       = null;

// ============================================================
// [SEC-03] Máquina de estados del botón (Sovereign Confirm)
// ============================================================

function _resetToIdle() {
    clearTimeout(_armTimer);
    _state = WIZARD_STATE.IDLE;
    if (_btn) {
        _btn.textContent = 'INITIATE SSO PROTOCOL';
        _btn.classList.remove('vault-action-primary--arming', 'vault-action-primary--executing');
        _btn.disabled = false;
    }
    console.log('[GenesisWizard] Ceremonia cancelada — timeout de armado. Volviendo a IDLE.');
}

function _arm() {
    _state = WIZARD_STATE.ARMING;
    if (_btn) {
        _btn.textContent = 'CONFIRM SUBMISSION';
        _btn.classList.add('vault-action-primary--arming');
    }
    // Auto-reset si el segundo click no llega en ARMING_TIMEOUT_MS
    _armTimer = setTimeout(_resetToIdle, ARMING_TIMEOUT_MS);
    console.log('[GenesisWizard] ARMING — confirmación requerida en 5s.');
}

async function _execute() {
    clearTimeout(_armTimer);
    _state = WIZARD_STATE.EXECUTING;
    if (_btn) {
        _btn.textContent = 'PROCESSING...';
        _btn.classList.remove('vault-action-primary--arming');
        _btn.classList.add('vault-action-primary--executing');
        _btn.disabled = true;
    }
    await _runCeremony();
}

// ============================================================
// [SEC-04] Ceremonia asíncrona (Theater of Security)
// ============================================================

const _delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Teatro de seguridad de 2.7s — educa el ritmo del usuario.
 * No realiza validaciones reales. El KYC ocurrirá dentro del CRM.
 */
async function _runCeremony() {
    console.log('[GenesisWizard] ▶ Ceremony initiated. Encrypting payload...');
    await _delay(CEREMONY_STEP_MS);
    console.log('[GenesisWizard] ▶ Validating schema...');
    await _delay(CEREMONY_STEP_MS);
    console.log('[GenesisWizard] ▶ Establishing secure channel...');
    await _delay(CEREMONY_STEP_MS);

    // Mutación de estado: GESTATION → EMBRYONIC (El Trámite)
    const anonState = createEmptyState();
    anonState.fiduciary_state = 'EMBRYONIC';
    anonState.last_updated    = Date.now();
    sessionStorage.setItem(ANON_PROJECT_KEY, JSON.stringify(anonState));

    console.log('[GenesisWizard] ✓ AnonProjectState → EMBRYONIC. Golden Gate cruzado.');

    // Evento de cruce — Router + main.js escuchan
    document.dispatchEvent(new CustomEvent('Skeleton:Action:GateCrossed', {
        detail: Object.freeze({ fiduciary_state: 'EMBRYONIC' }),
        bubbles: true,
    }));
}

// ============================================================
// [SEC-05] Módulo GenesisWizard (init)
// ============================================================

export const GenesisWizard = {

    /**
     * Inicializa la esclusa.
     * Escucha Skeleton:Action:GateWake (emitido por Router al clic en .vault-action-primary).
     * Implementa el patrón Sovereign Confirm: IDLE → ARMING → EXECUTING.
     */
    init() {
        _btn = document.querySelector('.vault-action-primary');

        if (!_btn) {
            console.warn('[GenesisWizard] .vault-action-primary no encontrado — esclusa inactiva.');
            return;
        }

        document.addEventListener('Skeleton:Action:GateWake', () => {
            if (_state === WIZARD_STATE.EXECUTING) return; // Ceremonia en curso — ignorar

            if (_state === WIZARD_STATE.IDLE) {
                _arm();
            } else if (_state === WIZARD_STATE.ARMING) {
                _execute();
            }
        });

        console.log('[GenesisWizard] Esclusa del Golden Gate activa. (Sovereign Confirm listo)');
    },
};

// ============================================================
// [SEC-06] Export
// ============================================================

export default GenesisWizard;
