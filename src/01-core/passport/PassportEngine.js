// %[CARRIL-AIP-CORE] - [Fase 18.1]
/**
 * PassportEngine.js (v2 - Audit Corrected)
 * Soberanía de Identidad y Clearance Fiduciario.
 * R25 (Zero-DOM) | R18 (ES Modules) | R11 (Fiduciary Bus) | R27 (Immutability)
 */

import { StorageAdapter } from 'infra/storage/StorageAdapter.js';

const IDENTITY_KEY = 'skeleton_passport';

/**
 * Niveles de Clearance Fiduciario (R12)
 * Nomenclatura: DOMAIN_BLUEPRINT_01.md §1.1 (Privilegio Progresivo)
 * Migrado de FARO/MOCHILA/VELO/ARSENAL → GUEST/BRONZE/SILVER/GOLD/PLATINUM (DT-PASSPORT-01 · 2026-05-24)
 */
export const CLEARANCE_LEVELS = {
    GUEST:    0,  // Visitante anónimo / IntegrityScore < 60
    BRONZE:   1,  // IntegrityScore 60-74 / KYC Tier 1
    SILVER:   2,  // IntegrityScore 75-79 / Due Diligence Inicial
    GOLD:     3,  // IntegrityScore 80-89 / Full Access
    PLATINUM: 4,  // IntegrityScore 90-100 / Máximo Clearance Fiduciario
};

/**
 * PassportEngine: El árbitro de la identidad y el acceso en la Órbita 1.
 */
export const PassportEngine = {
    
    /**
     * Obtiene el estado actual de la identidad desde el SSoT canónico.
     */
    getIdentity() {
        return StorageAdapter.get(IDENTITY_KEY, 'session') || this.getGuestIdentity();
    },

    getGuestIdentity() {
        return {
            archetype: 'GUEST',
            clearance: CLEARANCE_LEVELS.GUEST,
            integrity_score: 0,
        };
    },

    /**
     * Actualiza el arquetipo y sincroniza el nivel de acceso.
     */
    setArchetype(archetype) {
        const identity = this.getIdentity();
        identity.archetype = archetype;
        identity.clearance = Math.max(identity.clearance, CLEARANCE_LEVELS.BRONZE);
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
        // Umbrales DOMAIN_BLUEPRINT_01.md §1.1 — DT-PASSPORT-01
        if      (score >= 90) identity.clearance = CLEARANCE_LEVELS.PLATINUM;
        else if (score >= 80) identity.clearance = CLEARANCE_LEVELS.GOLD;
        else if (score >= 75) identity.clearance = CLEARANCE_LEVELS.SILVER;
        else if (score >= 60) identity.clearance = CLEARANCE_LEVELS.BRONZE;
        else                  identity.clearance = CLEARANCE_LEVELS.GUEST;
        this._save(identity);
    },

    /**
     * Persistencia y despacho de eventos en el bus fiduciario (document).
     * @private
     */
    _save(identity) {
        StorageAdapter.set(IDENTITY_KEY, identity, 'session');
        // Despacho a nivel de documento (R11)
        const event = new CustomEvent('Skeleton:IdentityUpdated', { detail: identity });
        document.dispatchEvent(event);
    },

    /**
     * Purga total de la identidad (Skeleton:IdentityBurned).
     */
    burn() {
        StorageAdapter.remove(IDENTITY_KEY, 'session');
        document.dispatchEvent(new CustomEvent('Skeleton:IdentityBurned'));
        console.warn('[PassportEngine] SSoT skeleton_passport purgado.');
    }
};

export default PassportEngine;
