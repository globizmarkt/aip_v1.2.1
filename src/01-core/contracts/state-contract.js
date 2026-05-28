/**
 * @file state-contract.js
 * @description Contrato de estado base para AIP v1.3. Define la topología de los datos.
 */

export const STATE_VERSION = 1;

export const initialState = {
    auth: {
        isAuthenticated: false,
        userId: null,
        role: 'guest', // guest | inv | agent | admin
        tier: null,
        jurisdiction: null,
        kycStatus: 'pending',
        sessionExpiresAt: null
    },
    ui: {
        activeRoute: '/',
        theme: 'dark',
        allowedComponents: [] // Whitelist inyectado por Claims
    },
    system: {
        version: STATE_VERSION,
        isOnline: true,
        isLocked: false,
        lastError: null
    }
};

/**
 * Valida la integridad estructural del estado antes de permitir la persistencia.
 * @param {Object} state - El snapshot del estado a evaluar.
 * @returns {boolean}
 */
export function isValidStateShape(state) {
    if (!state || typeof state !== 'object') return false;
    if (state.system?.version !== STATE_VERSION) return false;
    if (!state.auth || typeof state.auth.isAuthenticated !== 'boolean') return false;
    if (!Array.isArray(state.ui?.allowedComponents)) return false;
    return true;
}
