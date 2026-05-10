// %[CARRIL-AIP-CORE] - [Fase 18.1]
/**
 * IntegrityEngine.js
 * Motor de Bancabilidad e IntegrityScore.
 * R25 (Zero-DOM) | R18 (ES Modules)
 */

import { PassportEngine } from 'core/passport/PassportEngine.js';

const THRESHOLD_BANCABILITY = 60;

/**
 * IntegrityEngine: El validador de riesgos y bancabilidad en la Órbita 1.
 * Pure logic. Zero-DOM.
 */
export const IntegrityEngine = {

    /**
     * Calcula el IntegrityScore del usuario.
     * @returns {Object} { score: number, isBancable: boolean }
     * MOCK: Retorna 45 (Umbral de bancabilidad = 60).
     */
    calculateScore() {
        // En Fase 18.1 operamos con score estático de 45 (Debajo del umbral).
        const currentScore = 45; 
        
        console.log(`[IntegrityEngine] Score calculado: ${currentScore} (Umbral Requerido: ${THRESHOLD_BANCABILITY})`);
        
        // Sincronización fiduciaria con el Pasaporte
        PassportEngine.updateIntegrityScore(currentScore);
        
        return {
            score: currentScore,
            isBancable: currentScore >= THRESHOLD_BANCABILITY
        };
    },

    /**
     * Verifica si el usuario actual en el Pasaporte cumple con el umbral.
     * @returns {boolean}
     */
    isBancable() {
        const identity = PassportEngine.getIdentity();
        return (identity.integrity_score || 0) >= THRESHOLD_BANCABILITY;
    }
};

export default IntegrityEngine;
