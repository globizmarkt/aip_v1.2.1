// ============================================================================
// userFSM.js
// Máquina de Estados Finitos del Usuario — User Finite State Machine (FSM-01)
// ============================================================================
// ÉPICA    : E3/E4 — Onboarding Spine / CRM Access
// TICKET   : FSM-01 — Apertura formal VIBE-AIP-S-REBORN-03.5
// AGENTE   : Claude Code (Sentinel) · Arquitectura: Kimi (auditoría 03.4)
// DOCTRINA : R11 (PascalCase eventos) · R18 (ES Modules) · R20 (Event-Driven)
//            R27 (Immutabilidad recursiva) · R0 (Zero-Trust)
// SESIÓN   : VIBE-AIP-S-REBORN-03.5 · 2026-05-26
// ============================================================================

/**
 * Estados canónicos del usuario en AIP.
 *
 * ANONYMOUS    → Visitante sin credenciales. Estado inicial tras boot.
 * KYC_PENDING  → Solicitud de acceso enviada. Validación en curso (PassportValidator).
 * KYC_VERIFIED → Acceso concedido. CRM activo. wc whitelist disponible en contexto.
 * BLOCKED      → Acceso denegado. reason code en contexto. No puede operar.
 */
export const USER_STATES = Object.freeze({
    ANONYMOUS:    'ANONYMOUS',
    KYC_PENDING:  'KYC_PENDING',
    KYC_VERIFIED: 'KYC_VERIFIED',
    BLOCKED:      'BLOCKED',
});

/**
 * TRANSITION_MAP — Única fuente de verdad para transiciones válidas (R0).
 * Formato: { fromState: { eventName: toState } }
 * Transición no declarada = silenciosamente ignorada (Zero-Trust).
 *
 * Diagrama:
 *
 *   ANONYMOUS ──[ACCESS_REQUESTED]──► KYC_PENDING
 *                                          │
 *                          [ACCESS_GRANTED]├──► KYC_VERIFIED ──[SESSION_EXPIRED]──► ANONYMOUS
 *                                          │         └──────[ADMIN_BLOCK]──────────► BLOCKED
 *                          [ACCESS_DENIED] └──► BLOCKED ──────[RESET]──────────────► ANONYMOUS
 */
const TRANSITION_MAP = Object.freeze({
    [USER_STATES.ANONYMOUS]: Object.freeze({
        ACCESS_REQUESTED: USER_STATES.KYC_PENDING,
    }),
    [USER_STATES.KYC_PENDING]: Object.freeze({
        ACCESS_GRANTED:   USER_STATES.KYC_VERIFIED,
        ACCESS_DENIED:    USER_STATES.BLOCKED,
    }),
    [USER_STATES.KYC_VERIFIED]: Object.freeze({
        SESSION_EXPIRED:  USER_STATES.ANONYMOUS,
        ADMIN_BLOCK:      USER_STATES.BLOCKED,
    }),
    [USER_STATES.BLOCKED]: Object.freeze({
        RESET:            USER_STATES.ANONYMOUS,
    }),
});

const CONFIG = Object.freeze({
    EVENT_BUS:    document,
    EVENT_PREFIX: 'Skeleton:FSM',  // → Skeleton:FSM:StateChanged (R11/R20)
});

// ── Estado privado del módulo (no exportado — inaccesible desde fuera) ───────
let _state   = USER_STATES.ANONYMOUS;
let _context = Object.freeze({ wc: [], reason: null, timestamp: null });

// ── API pública ───────────────────────────────────────────────────────────────
export const UserFSM = Object.freeze({

    /** Estado actual de la FSM (lectura). */
    getState() { return _state; },

    /**
     * Contexto del último veredicto.
     * @returns {{ wc: string[], reason: string|null, timestamp: number|null }}
     */
    getContext() { return _context; },

    /**
     * Ejecuta una transición si es válida desde el estado actual.
     * Emite Skeleton:FSM:StateChanged con payload inmutable.
     *
     * @param {string} event  — clave declarada en TRANSITION_MAP
     * @param {object} [ctx]  — { wc?: string[], reason?: string }
     * @returns {boolean}     — true si la transición fue ejecutada
     */
    transition(event, ctx = {}) {
        const allowed = TRANSITION_MAP[_state];

        if (!allowed || !(event in allowed)) {
            console.warn(`[UserFSM] Transición inválida: ${_state} --${event}--> ??? (ignorada — R0)`);
            return false;
        }

        const prev = _state;
        _state     = allowed[event];
        _context   = Object.freeze({
            wc:        Array.isArray(ctx.wc) ? Object.freeze([...ctx.wc]) : Object.freeze([]),
            reason:    ctx.reason ?? null,
            timestamp: Date.now(),
        });

        CONFIG.EVENT_BUS.dispatchEvent(new CustomEvent(
            `${CONFIG.EVENT_PREFIX}:StateChanged`,
            {
                detail:   Object.freeze({ from: prev, to: _state, event, context: _context }),
                bubbles:  true,
                composed: false,
            }
        ));

        console.log(`[UserFSM] ${prev} --${event}--> ${_state}`);
        return true;
    },

    /**
     * Resetea la FSM a ANONYMOUS desde cualquier estado.
     * Usar en logout, expiración de sesión o expulsión administrativa.
     * Si el estado actual es BLOCKED, equivale a transition('RESET').
     * Desde cualquier otro estado, aplica FORCE_RESET.
     */
    reset() {
        if (_state === USER_STATES.ANONYMOUS) return;

        const prev = _state;

        // Intentar transición declarada primero (BLOCKED → RESET → ANONYMOUS)
        const cleanTransition = this.transition('RESET');

        // Si no había transición RESET (p.ej. desde KYC_VERIFIED), forzar
        if (!cleanTransition) {
            _state   = USER_STATES.ANONYMOUS;
            _context = Object.freeze({ wc: [], reason: 'FORCE_RESET', timestamp: Date.now() });
            CONFIG.EVENT_BUS.dispatchEvent(new CustomEvent(
                `${CONFIG.EVENT_PREFIX}:StateChanged`,
                {
                    detail:   Object.freeze({ from: prev, to: _state, event: 'FORCE_RESET', context: _context }),
                    bubbles:  true,
                    composed: false,
                }
            ));
            console.log(`[UserFSM] FORCE_RESET: ${prev} → ${_state}`);
        }
    },

    /**
     * Suscripción tipada a cambios de estado.
     * @param {Function} handler — recibe { from, to, event, context }
     * @returns {Function} unsubscribe — invocar para limpiar el listener
     */
    onStateChange(handler) {
        const fn = (e) => handler(e.detail);
        CONFIG.EVENT_BUS.addEventListener(`${CONFIG.EVENT_PREFIX}:StateChanged`, fn);
        return () => CONFIG.EVENT_BUS.removeEventListener(`${CONFIG.EVENT_PREFIX}:StateChanged`, fn);
    },
});

export default UserFSM;
