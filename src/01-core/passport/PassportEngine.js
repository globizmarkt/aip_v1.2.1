// %[CARRIL-AIP-CORE] - [Fase 18.1]
/**
 * PassportEngine.js (v2 - Audit Corrected)
 * Soberanía de Identidad y Clearance Fiduciario.
 * R25 (Zero-DOM) | R18 (ES Modules) | R11 (Fiduciary Bus) | R27 (Immutability)
 */

const STORAGE_PREFIX = 'AIP_LANDING_V0_';
const KEYS = {
    IDENTITY: `${STORAGE_PREFIX}skeleton_passport`
};

/**
 * Niveles de Clearance Fiduciario (R12)
 */
export const CLEARANCE_LEVELS = {
    FARO: 1,      // Público / Email verificado
    MOCHILA: 2,   // KYC Básico / Arquetipo Detectado
    VELO: 3,      // NCNDA Firmado / Due Diligence Inicial
    ARSENAL: 4    // Full Access / IntegrityScore >= 60
};

/**
 * PassportEngine: El árbitro de la identidad y el acceso en la Órbita 1.
 */
export const PassportEngine = {
    
    /**
     * Obtiene el estado actual de la identidad desde el SSoT canónico.
     */
    getIdentity() {
        const raw = sessionStorage.getItem(KEYS.IDENTITY);
        try {
            return raw ? JSON.parse(raw) : this.getGuestIdentity();
        } catch (e) {
            return this.getGuestIdentity();
        }
    },

    getGuestIdentity() {
        return {
            archetype: 'GUEST',
            clearance: CLEARANCE_LEVELS.FARO,
            kyc_status: 'NONE',
            integrity_score: 0
        };
    },

    /**
     * Actualiza el arquetipo y sincroniza el nivel de acceso.
     */
    setArchetype(archetype) {
        const identity = this.getIdentity();
        identity.archetype = archetype;
        identity.clearance = Math.max(identity.clearance, CLEARANCE_LEVELS.MOCHILA);
        this._save(identity);
        return identity;
    },

    hasClearance(requiredLevel) {
        const identity = this.getIdentity();
        return identity.clearance >= requiredLevel;
    },

    updateIntegrityScore(score) {
        const identity = this.getIdentity();
        identity.integrity_score = score;
        if (score >= 60) identity.clearance = CLEARANCE_LEVELS.ARSENAL;
        this._save(identity);
    },

    /**
     * Persistencia y despacho de eventos en el bus fiduciario (document).
     * @private
     */
    _save(identity) {
        sessionStorage.setItem(KEYS.IDENTITY, JSON.stringify(identity));
        // Despacho a nivel de documento (R11)
        const event = new CustomEvent('Skeleton:IdentityUpdated', { detail: identity });
        document.dispatchEvent(event);
    },

    /**
     * Purga total de la identidad (Skeleton:IdentityBurned).
     */
    burn() {
        sessionStorage.removeItem(KEYS.IDENTITY);
        document.dispatchEvent(new CustomEvent('Skeleton:IdentityBurned'));
        console.warn('[PassportEngine] SSoT skeleton_passport purgado.');
    }
};

export default PassportEngine;
