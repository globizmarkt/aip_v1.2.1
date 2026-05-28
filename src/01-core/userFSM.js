// ============================================================================
// userFSM.js
// Máquina de Estados Finitos del Usuario — User Finite State Machine (FSM-01)
// ============================================================================
// ÉPICA    : E3/E4 — Onboarding Spine / CRM Access
// TICKET   : FSM-01 — Homologación definitiva VIBE-AIP-S-REBORN-03.6
// AGENTE   : Claude Code (Sentinel) · Arquitectura: Kimi/Director
// DOCTRINA : R11 (PascalCase eventos) · R18 (ES Modules) · R20 (Event-Driven)
//            R27 (Immutabilidad recursiva) · R0 (Zero-Trust)
// SESIÓN   : VIBE-AIP-S-REBORN-03.6 · 2026-05-26
// ============================================================================

export const USER_STATES = Object.freeze({
    BOOT_SEQUENCE:            'BOOT_SEQUENCE',
    ORBIT_1_GUEST:            'ORBIT_1_GUEST',
    ORBIT_2_GATEKEEPER:       'ORBIT_2_GATEKEEPER',
    ORBIT_3_LEGAL_ATTESTATION: 'ORBIT_3_LEGAL_ATTESTATION',
    ORBIT_3_CRM_ACTIVE:       'ORBIT_3_CRM_ACTIVE',
    ACCESS_BLOCKED:           'ACCESS_BLOCKED',
});

const TRANSITION_MAP = Object.freeze({
    [USER_STATES.BOOT_SEQUENCE]: Object.freeze({
        NO_SESSION_FOUND:      USER_STATES.ORBIT_1_GUEST,
        SESSION_TOKEN_FOUND:   USER_STATES.ORBIT_2_GATEKEEPER,
    }),
    [USER_STATES.ORBIT_1_GUEST]: Object.freeze({
        LOGIN_SUBMITTED:       USER_STATES.ORBIT_2_GATEKEEPER,
    }),
    [USER_STATES.ORBIT_2_GATEKEEPER]: Object.freeze({
        'Skeleton:Gatekeeper:AccessGranted': USER_STATES.ORBIT_3_LEGAL_ATTESTATION,
        'Skeleton:Gatekeeper:AccessDenied':  USER_STATES.ACCESS_BLOCKED,
    }),
    [USER_STATES.ORBIT_3_LEGAL_ATTESTATION]: Object.freeze({
        'Skeleton:Legal:Accepted':           USER_STATES.ORBIT_3_CRM_ACTIVE,
        LOGOUT_REQUESTED:                    USER_STATES.ORBIT_1_GUEST,
        SESSION_EXPIRED:                     USER_STATES.ORBIT_2_GATEKEEPER,
    }),
    [USER_STATES.ORBIT_3_CRM_ACTIVE]: Object.freeze({
        LOGOUT_REQUESTED:      USER_STATES.ORBIT_1_GUEST,
        SESSION_EXPIRED:       USER_STATES.ORBIT_2_GATEKEEPER,
        POLICY_DRIFT_DETECTED: USER_STATES.ORBIT_2_GATEKEEPER,
    }),
    [USER_STATES.ACCESS_BLOCKED]: Object.freeze({
        RESET_FLOW:            USER_STATES.ORBIT_1_GUEST,
    }),
});

const CONFIG = Object.freeze({
    EVENT_BUS:    document,
    EVENT_PREFIX: 'Skeleton:FSM',
});

let _state   = USER_STATES.BOOT_SEQUENCE;
let _context = Object.freeze({ wc: [], reason: null, timestamp: null });

export const UserFSM = Object.freeze({
    getState() { return _state; },
    getContext() { return _context; },

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
            { detail: Object.freeze({ from: prev, to: _state, event, context: _context }), bubbles: true, composed: false }
        ));
        console.log(`[UserFSM] ${prev} --${event}--> ${_state}`);
        return true;
    },

    boot() {
        if (_state !== USER_STATES.BOOT_SEQUENCE) return false;
        const hasSession = !!localStorage.getItem('aip_session_token');
        const event = hasSession ? 'SESSION_TOKEN_FOUND' : 'NO_SESSION_FOUND';
        return this.transition(event);
    },

    reset() {
        if (_state === USER_STATES.ORBIT_1_GUEST) return;
        const prev = _state;
        const cleanTransition = this.transition('RESET_FLOW');
        if (!cleanTransition) {
            _state   = USER_STATES.ORBIT_1_GUEST;
            _context = Object.freeze({ wc: [], reason: 'FORCE_RESET', timestamp: Date.now() });
            CONFIG.EVENT_BUS.dispatchEvent(new CustomEvent(
                `${CONFIG.EVENT_PREFIX}:StateChanged`,
                { detail: Object.freeze({ from: prev, to: _state, event: 'FORCE_RESET', context: _context }), bubbles: true, composed: false }
            ));
        }
    },

    onStateChange(handler) {
        const fn = (e) => handler(e.detail);
        CONFIG.EVENT_BUS.addEventListener(`${CONFIG.EVENT_PREFIX}:StateChanged`, fn);
        return () => CONFIG.EVENT_BUS.removeEventListener(`${CONFIG.EVENT_PREFIX}:StateChanged`, fn);
    }
});
export default UserFSM;
