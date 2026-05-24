// ============================================================
// ARCHIVO  : sessionGC.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-24
// PROPÓSITO: Recolector de Basura Fiduciaria. Purga residuos legacy de storage
//            y aplica TTL de 24h sobre el estado de proyecto anónimo (AnonProjectState).
//            Se ejecuta en el Paso 0 del bootloader, antes de cualquier otra
//            operación de storage por parte del sistema.
// ============================================================
// ÉPICA    : E3 — Onboarding Spine
// TICKET   : E3-T03
// AGENTE   : Claude Code
// DOCTRINA : R-DOM-02 (Proyecto huérfano — TTL fiduciario) · R18 (ES Modules) · R25 (Zero-DOM)
// ============================================================

// ÍNDICE
// [SEC-01] Constantes de configuración
// [SEC-02] Purga de residuos legacy
// [SEC-03] Validación TTL de AnonProjectState
// [SEC-04] Módulo sessionGC (init)
// [SEC-05] Export

// ============================================================
// [SEC-01] Constantes de configuración
// ============================================================

/** Claves legacy a erradicar incondicionalmente de cualquier storage. */
const LEGACY_KEYS = ['kyc_status'];

/** Clave de sessionStorage donde GenesisWizard.js persistirá el proyecto anónimo. */
const ANON_PROJECT_KEY = 'AnonProjectState';

/** Time-To-Live de una sesión anónima: 24 horas en milisegundos. */
const TTL_MS = 86_400_000;

// ============================================================
// [SEC-02] Purga de residuos legacy
// ============================================================

/**
 * Erradica claves legacy de localStorage Y sessionStorage.
 * Opera sin condiciones — si la clave no existe, removeItem es no-op.
 */
function _purgeLegacyKeys() {
    for (const key of LEGACY_KEYS) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }
}

// ============================================================
// [SEC-03] Validación TTL de AnonProjectState
// ============================================================

/**
 * Lee AnonProjectState del sessionStorage y evalúa su antigüedad.
 * Si supera TTL_MS (24h), purga el estado y emite aviso fiduciario (R-DOM-02).
 * Si el JSON está corrupto, también purga sin propagar excepción.
 */
function _validateAnonProjectTTL() {
    const raw = sessionStorage.getItem(ANON_PROJECT_KEY);
    if (!raw) return;

    try {
        const state = JSON.parse(raw);
        const elapsed = Date.now() - (state.last_updated ?? 0);

        if (elapsed > TTL_MS) {
            sessionStorage.removeItem(ANON_PROJECT_KEY);
            console.warn('[SessionGC] AnonProjectState purgado por caducidad fiduciaria (>24h). R-DOM-02.');
        }
    } catch {
        sessionStorage.removeItem(ANON_PROJECT_KEY);
        console.warn('[SessionGC] AnonProjectState corrupto erradicado de sessionStorage.');
    }
}

// ============================================================
// [SEC-04] Módulo sessionGC (init)
// ============================================================

const sessionGC = {
    /**
     * Punto de entrada del Recolector de Basura Fiduciaria.
     * Ejecuta secuencialmente: purga legacy → validación TTL.
     * No lanza excepciones — el bootloader no debe quedar bloqueado por el GC.
     */
    init() {
        try {
            _purgeLegacyKeys();
            _validateAnonProjectTTL();
        } catch (e) {
            console.warn('[SessionGC] Error inesperado en GC — operación abortada sin bloquear boot.', e);
        }
    },
};

// ============================================================
// [SEC-05] Export
// ============================================================

export default sessionGC;
