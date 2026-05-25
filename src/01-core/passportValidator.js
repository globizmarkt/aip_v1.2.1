// ============================================================================
// passportValidator.js
// Resolución DT-018 — Validador Fiduciario de Acceso (Server-Driven UI)
// ============================================================================
// ÉPICA    : E3/E4 — Onboarding Spine / CRM Access
// TICKET   : DT-018
// AGENTE   : Sentinel (diseño COG-62) · Claude Code (inyección física)
// DOCTRINA : R11 (PascalCase eventos) · R18 (ES Modules) · R20 (Event-Driven)
//            R27 (Immutabilidad recursiva) · R0 (Zero-Trust)
// SESIÓN   : VIBE-AIP-S-REBORN-03.4 · 2026-05-25
// ============================================================================

export const PassportValidator = {
    CONFIG: Object.freeze({
        KYC_OK_VALUE: 'ok',
        EVENT_BUS: document,
        EVENT_PREFIX: 'Skeleton:Gatekeeper', // Sutura R11/R20
        MIN_PAYLOAD_VERSION: 1,
    }),

    REJECT_CODES: Object.freeze({
        KYC_MISSING:      'ERR_KYC_FIELD_MISSING',
        KYC_NOT_OK:       'ERR_KYC_STATUS_NOT_OK',
        WC_MISSING:       'ERR_WC_ARRAY_MISSING',
        WC_EMPTY:         'ERR_WC_ARRAY_EMPTY',
        PAYLOAD_NULL:     'ERR_PAYLOAD_NULL',
        PAYLOAD_INVALID:  'ERR_PAYLOAD_INVALID_STRUCTURE',
    }),

    validateAccess(tokenPayload) {
        if (!tokenPayload || typeof tokenPayload !== 'object') return this._deny(this.REJECT_CODES.PAYLOAD_NULL, null);
        if (!this._hasValidStructure(tokenPayload))            return this._deny(this.REJECT_CODES.PAYLOAD_INVALID, tokenPayload);
        if (!('kyc' in tokenPayload))                          return this._deny(this.REJECT_CODES.KYC_MISSING, tokenPayload);
        if (tokenPayload.kyc !== this.CONFIG.KYC_OK_VALUE)    return this._deny(this.REJECT_CODES.KYC_NOT_OK, tokenPayload);

        const wc = tokenPayload.wc;
        if (!Array.isArray(wc))  return this._deny(this.REJECT_CODES.WC_MISSING, tokenPayload);
        if (wc.length === 0)     return this._deny(this.REJECT_CODES.WC_EMPTY, tokenPayload);

        return this._grant(tokenPayload, Object.freeze([...wc]));
    },

    _deny(reasonCode, rawPayload) {
        const result = Object.freeze({
            granted:   false,
            reason:    reasonCode,
            wc:        Object.freeze([]),
            raw:       rawPayload,
            timestamp: Date.now(),
        });
        this.CONFIG.EVENT_BUS.dispatchEvent(new CustomEvent(
            `${this.CONFIG.EVENT_PREFIX}:AccessDenied`,
            { detail: result, bubbles: true, composed: false }
        ));
        return result;
    },

    _grant(rawPayload, wcWhitelist) {
        const result = Object.freeze({
            granted:   true,
            reason:    null,
            wc:        wcWhitelist,
            raw:       rawPayload,
            timestamp: Date.now(),
        });
        this.CONFIG.EVENT_BUS.dispatchEvent(new CustomEvent(
            `${this.CONFIG.EVENT_PREFIX}:AccessGranted`,
            { detail: result, bubbles: true, composed: false }
        ));
        return result;
    },

    _hasValidStructure(payload) {
        const required = [
            { key: 'usr',  type: 'string' },
            { key: 'rol',  type: 'string' },
            { key: 'tier', type: 'string' },
            { key: 'jur',  type: 'string' },
            { key: 'kyc',  type: 'string' },
            { key: 'pv',   type: 'number' },
            { key: 'wc',   type: 'object' },  // Array validado en validateAccess
        ];
        return required.every(field => {
            const value = payload[field.key];
            if (value === undefined || value === null)          return false;
            if (field.type === 'object' && !Array.isArray(value)) return false;
            if (field.type !== 'object' && typeof value !== field.type) return false;
            return true;
        });
    },

    /**
     * Suscripción tipada al resultado del validador.
     * @param {'granted'|'denied'} verdict
     * @param {Function} callback — recibe el objeto result congelado
     * @returns {Function} unsubscribe — llamar para limpiar el listener
     */
    onVerdict(verdict, callback) {
        const eventName = verdict === 'granted'
            ? `${this.CONFIG.EVENT_PREFIX}:AccessGranted`
            : `${this.CONFIG.EVENT_PREFIX}:AccessDenied`;
        const handler = (e) => callback(e.detail);
        this.CONFIG.EVENT_BUS.addEventListener(eventName, handler);
        return () => this.CONFIG.EVENT_BUS.removeEventListener(eventName, handler);
    },
};

Object.freeze(PassportValidator);
export default PassportValidator;
