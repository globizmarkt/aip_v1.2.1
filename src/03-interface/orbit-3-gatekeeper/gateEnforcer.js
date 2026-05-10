/* METAFAC: DEPRECATED_LEGACY_ASSET | ORIGIN: AIP_v1.1 | REASON: PHASE_15_SUTURE */
// %[BULLDOZER-AIP-006-R2] - [Bulldozer] - [Gate Enforcer DT-019] - [2026-04-25] - [core/gateEnforcer.js]
// Doctrinas: R0 (Zero-DOM en Core), R7 (Inhibición Visual delegada), R15 (IntegrityScore Hard Gate)
// NOTA_QWEN_STITCH: Este módulo NO toca el DOM. UI Binder debe usar enforceProjectGate() para aplicar .skeleton-blur.

const INTEGRITY_THRESHOLD = 60;

const CLEARANCE_HIERARCHY = Object.freeze({
    BRONZE: 1,
    SILVER: 2,
    GOLD: 3,
    BLACK: 4
});

/**
 * evaluateAccess — Lógica pura para determinar si el nivel actual supera el requerido.
 * @param {string} currentLevel - Clearance de PassportEngine (ej. 'SILVER')
 * @param {string} requiredLevel - Clearance del recurso (ej. 'SILVER')
 * @returns {boolean}
 */
export function evaluateAccess(currentLevel, requiredLevel) {
    if (!currentLevel || !requiredLevel) return false;
    return (CLEARANCE_HIERARCHY[currentLevel] || 0) >= (CLEARANCE_HIERARCHY[requiredLevel] || 0);
}

/**
 * enforceProjectGate — Evalúa un proyecto contra el estado del Pasaporte.
 * Incluye comprobación R15: IntegrityScore >= 60. Si falla, el rango es irrelevante.
 * @param {object} project - Documento de Firestore (debe contener { clearanceRequired: 'SILVER' })
 * @returns {object} { isAccessible: boolean, reason: string, requiredLevel: string, currentLevel: string }
 */
export function enforceProjectGate(project) {
    if (!project || !project.clearanceRequired) {
        return { isAccessible: false, reason: 'INVALID_PROJECT_CONFIG', requiredLevel: 'BRONZE', currentLevel: null };
    }

    // R5: Lectura esterilizada del entorno volátil
    const passport = (typeof window !== 'undefined' && window.PassportEngine) ? window.PassportEngine : null;

    if (!passport) {
        return { isAccessible: false, reason: 'PASSPORT_MISSING', requiredLevel: project.clearanceRequired, currentLevel: null };
    }

    // R15 (IntegrityScore Hard Gate): Bypass fiduciario. El rango no importa si la integridad está comprometida.
    if (typeof passport.integrityScore !== 'number' || passport.integrityScore < INTEGRITY_THRESHOLD) {
        return {
            isAccessible: false,
            reason: 'INTEGRITY_COMPROMISED',
            requiredLevel: project.clearanceRequired,
            currentLevel: passport.clearanceLevel
        };
    }

    const currentClearance = passport.clearanceLevel;
    const hasClearance = evaluateAccess(currentClearance, project.clearanceRequired);

    return {
        isAccessible: hasClearance,
        reason: hasClearance ? 'ACCESS_GRANTED' : 'CLEARANCE_INSUFFICIENT',
        requiredLevel: project.clearanceRequired,
        currentLevel: currentClearance
    };
}
