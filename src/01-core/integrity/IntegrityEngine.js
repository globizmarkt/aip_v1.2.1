// ============================================================
// ARCHIVO  : IntegrityEngine.js
// VERSIÓN  : 2.0.0
// FECHA    : 2026-05-24
// PROPÓSITO: Motor de cálculo matemático del IntegrityScore fiduciario.
//            Implementa la fórmula estricta del DOMAIN_BLUEPRINT_01.md §1.3.
//            v2.0: Mock estático (45) reemplazado por motor real (DT-INTEGRITY-01).
// ============================================================
// ÉPICA    : E3 — Onboarding Spine (pre-requisito para GenesisWizard)
// TICKET   : DT-INTEGRITY-01
// AGENTE   : Claude Code
// DOCTRINA : R25 (Zero-DOM) · R18 (ES Modules) · R27 (Immutabilidad de pesos)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Pesos y umbrales (congelados R27)
// [SEC-03] Motor de cálculo (calculateScore)
// [SEC-04] Clasificador de clearance (getClearanceThreshold)
// [SEC-05] Módulo IntegrityEngine + métodos de conveniencia
// [SEC-06] Export

// ============================================================
// [SEC-01] Importaciones
// ============================================================

import { deepFreeze } from '../utils/deepFreeze.js';
import { PassportEngine } from '../passport/PassportEngine.js';

// ============================================================
// [SEC-02] Pesos y umbrales (congelados R27)
// ============================================================

/**
 * Pesos canónicos del IntegrityScore.
 * Fuente: DOMAIN_BLUEPRINT_01.md §1.3 — inmutables, no negociar.
 * Suma = 100 (garantía de normalización).
 */
export const WEIGHTS = deepFreeze({
    KYC:           40,  // Identidad verificada (KYC Tier 1/2/3)
    HISTORY:       25,  // Historial de operaciones completadas
    VERIFICATIONS: 20,  // Referencias, documentos, due diligence
    BEHAVIOR:      15,  // Comportamiento en plataforma (R14)
});

const MIN_BANCABLE = 60;  // Hard gate (R15) — inmutable

// ============================================================
// [SEC-03] Motor de cálculo (calculateScore)
// ============================================================

/**
 * Aplica la fórmula del DOMAIN_BLUEPRINT_01.md §1.3.
 * IntegrityScore = Σ (WEIGHT_i * score_i) — donde cada score_i ∈ [0, 1].
 *
 * @param {Object} profile - Perfil de factores del usuario. Cada campo es [0, 1].
 * @param {number} [profile.kyc_score=0]           - Grado de verificación KYC
 * @param {number} [profile.history_score=0]        - Historial de operaciones
 * @param {number} [profile.verification_score=0]   - Referencias y due diligence
 * @param {number} [profile.behavior_score=0]        - Comportamiento en plataforma
 * @returns {number} IntegrityScore redondeado, en el rango [0, 100].
 */
function _computeScore(profile) {
    if (!profile || typeof profile !== 'object') return 0;

    // Clamp defensivo: ningún factor puede salirse de [0, 1]
    const clamp = (v) => Math.min(1, Math.max(0, Number(v) || 0));

    const kyc           = clamp(profile.kyc_score);
    const history       = clamp(profile.history_score);
    const verifications = clamp(profile.verification_score);
    const behavior      = clamp(profile.behavior_score);

    const raw =
        (WEIGHTS.KYC           * kyc)           +
        (WEIGHTS.HISTORY       * history)       +
        (WEIGHTS.VERIFICATIONS * verifications) +
        (WEIGHTS.BEHAVIOR      * behavior);

    return Math.round(Math.min(100, Math.max(0, raw)));
}

// ============================================================
// [SEC-04] Clasificador de clearance (getClearanceThreshold)
// ============================================================

/**
 * Devuelve el nivel de clearance canónico para un IntegrityScore dado.
 * Fuente: DOMAIN_BLUEPRINT_01.md §1.1 (Privilegio Progresivo).
 *
 * @param {number} score - IntegrityScore [0-100]
 * @returns {string} 'GUEST' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
 */
export function getClearanceThreshold(score) {
    if (score >= 90) return 'PLATINUM';
    if (score >= 80) return 'GOLD';
    if (score >= 75) return 'SILVER';
    if (score >= 60) return 'BRONZE';
    return 'GUEST';
}

// ============================================================
// [SEC-05] Módulo IntegrityEngine
// ============================================================

export const IntegrityEngine = {

    /**
     * Calcula el IntegrityScore a partir del perfil de factores del usuario
     * y sincroniza el resultado con el PassportEngine.
     *
     * Pasar un perfil vacío o null (usuario anónimo) devuelve 0 —
     * comportamiento correcto por diseño (R14: fricción deliberada).
     *
     * @param {Object|null} identityProfile - Factores del perfil (ver _computeScore)
     * @returns {{ score: number, clearance: string, isBancable: boolean }}
     */
    calculateScore(identityProfile = null) {
        const score = _computeScore(identityProfile);
        const clearance = getClearanceThreshold(score);

        console.log(
            `[IntegrityEngine] Score: ${score}/100 | Clearance: ${clearance} | ` +
            `Bancable: ${score >= MIN_BANCABLE} (umbral R15: ${MIN_BANCABLE})`
        );

        // Sincronización fiduciaria con el Pasaporte (actualiza CLEARANCE_LEVELS)
        PassportEngine.updateIntegrityScore(score);

        return { score, clearance, isBancable: score >= MIN_BANCABLE };
    },

    /**
     * Verifica si el usuario activo en el Pasaporte supera el umbral de bancabilidad.
     * No recalcula — lee el score ya persistido en la identidad.
     *
     * @returns {boolean}
     */
    isBancable() {
        const identity = PassportEngine.getIdentity();
        return (identity.integrity_score || 0) >= MIN_BANCABLE;
    },
};

// ============================================================
// [SEC-06] Export
// ============================================================

export default IntegrityEngine;
// Named exports: IntegrityEngine · WEIGHTS · getClearanceThreshold
