/**
 * @file app-actions.js
 * @description Catálogo de mutaciones puras.
 * Doctrina R0: Obligatorio el Top-Level Replacement en el Proxy.
 * R-FREEZE aplicado: Object.freeze() sella el diccionario contra mutación en runtime.
 */

export const ACTIONS = Object.freeze({
    hydrateSession: (proxy, payload) => {
        proxy.auth = {
            ...proxy.auth,
            isAuthenticated: true,
            userId: payload.usr || proxy.auth.userId,
            role: payload.rol || 'guest',
            tier: payload.tier || null,
            jurisdiction: payload.jur || null,
            kycStatus: payload.kyc || 'pending'
        };
    },

    grantAccess: (proxy, payload) => {
        proxy.ui = {
            ...proxy.ui,
            allowedComponents: payload.wc || []
        };
    },

    blockAccess: (proxy, payload) => {
        proxy.auth = {
            ...proxy.auth,
            isAuthenticated: false
        };
        proxy.system = {
            ...proxy.system,
            isLocked: true,
            lastError: payload?.reason || 'Access Blocked by Gatekeeper'
        };
    },

    resetSession: (proxy) => {
        proxy.auth = {
            isAuthenticated: false,
            userId: null,
            role: 'guest',
            tier: null,
            jurisdiction: null,
            kycStatus: 'pending',
            sessionExpiresAt: null
        };
        proxy.ui = {
            ...proxy.ui,
            allowedComponents: [],
            activeRoute: '/'
        };
    }
});
