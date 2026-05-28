/**
 * @file app-guards.js
 * @description Predicados puros para la FSM. No tienen efectos secundarios.
 * Reciben el snapshot inmutable (readState) y el payload del evento.
 * R-FREEZE aplicado: Object.freeze() sella el diccionario contra mutación en runtime.
 */

export const GUARDS = Object.freeze({
    /**
     * Verifica si el payload SDUI contiene un array de Web Components válido.
     */
    hasValidSDUIPayload: (snapshot, payload) => {
        return payload && Array.isArray(payload.wc) && payload.wc.length > 0;
    },

    /**
     * Verifica si el usuario tiene un KYC aprobado.
     */
    isKycApproved: (snapshot) => {
        return snapshot.auth.kycStatus === 'ok';
    },

    /**
     * Verifica si la sesión actual no ha expirado.
     */
    isSessionValid: (snapshot) => {
        if (!snapshot.auth.sessionExpiresAt) return true;
        return Date.now() < snapshot.auth.sessionExpiresAt;
    }
});
