// %[CARRIL-AIP-BLUEPRINT] - [Fase 18.3] - [storage-adapter-blueprint.js]
/**
 * BLUEPRINT: StorageAdapter
 * Propósito: Plantilla de gemación para el Adaptador de Persistencia.
 * Doctrina: Zero-Leak (R5). Todo acceso a sessionStorage/localStorage pasa
 *           obligatoriamente por este módulo. Ningún motor de Órbita 1 o 3
 *           accede al storage directamente.
 *
 * USO EN GEMACIÓN:
 *   1. Copiar a src/02-infra/storage/StorageAdapter.js de la vertical.
 *   2. Reemplazar APP_PREFIX con el identificador único de la vertical
 *      (ej: 'AIP_LANDING_V0', 'AIP_CRM_V1').
 */

const APP_PREFIX = '__VERTICAL_PREFIX__'; // ← REEMPLAZAR en gemación

const StorageAdapter = (() => {
    function _key(k) {
        return `${APP_PREFIX}_${k}`;
    }

    // --- sessionStorage (datos volátiles de sesión) ---
    function getSession(key) {
        try {
            const raw = sessionStorage.getItem(_key(key));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setSession(key, value) {
        try {
            sessionStorage.setItem(_key(key), JSON.stringify(value));
        } catch (e) {
            console.error('[StorageAdapter] setSession error:', e);
        }
    }

    function removeSession(key) {
        sessionStorage.removeItem(_key(key));
    }

    // --- localStorage (preferencias persistentes entre sesiones) ---
    function getLocal(key) {
        try {
            const raw = localStorage.getItem(_key(key));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setLocal(key, value) {
        try {
            localStorage.setItem(_key(key), JSON.stringify(value));
        } catch (e) {
            console.error('[StorageAdapter] setLocal error:', e);
        }
    }

    function clearAll() {
        const keys = Object.keys(sessionStorage).filter(k => k.startsWith(APP_PREFIX));
        keys.forEach(k => sessionStorage.removeItem(k));
        console.log(`[StorageAdapter] Cleared ${keys.length} session keys for prefix ${APP_PREFIX}.`);
    }

    return { getSession, setSession, removeSession, getLocal, setLocal, clearAll };
})();

export { StorageAdapter };
