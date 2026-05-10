/**
 * AIP FINANCIAL & COMMODITIES — SISTEMA NERVIOSO CORE
 * DIRECTIVA 1: EL ALMACÉN ESTÉRIL (SSOT)
 * DOCTRINA R5 (Zero-Leak) / R25 (Zero-DOM)
 */

const APP_PREFIX = 'AIP_V1_';

/**
 * Wrapper de persistencia local fiduciaria.
 * Proporciona aislamiento de datos y persistencia entre sesiones.
 */
export const Store = {
    /**
     * Inicializa el almacén.
     */
    init() {
        console.log(`[Store] Inicializado bajo prefijo: ${APP_PREFIX}`);
        return this;
    },

    /**
     * Guarda un valor en el almacenamiento persistente.
     * @param {string} key - Clave sin prefijo.
     * @param {any} value - Dato a serializar.
     */
    set(key, value) {
        const fullKey = `${APP_PREFIX}${key.toUpperCase()}`;
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (e) {
            console.error(`[Store] Error al guardar ${key}:`, e);
            return false;
        }
    },

    /**
     * Recupera un valor del almacenamiento.
     * @param {string} key - Clave sin prefijo.
     * @returns {any|null}
     */
    get(key) {
        const fullKey = `${APP_PREFIX}${key.toUpperCase()}`;
        const data = localStorage.getItem(fullKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn(`[Store] Dato corrupto en ${key}, retornando null.`);
            return null;
        }
    },

    /**
     * Purga total del espacio de nombres soberano.
     */
    purge() {
        Object.keys(localStorage).forEach(fullKey => {
            if (fullKey.startsWith(APP_PREFIX)) {
                localStorage.removeItem(fullKey);
            }
        });
        console.warn(`[Store] Purgado total del espacio ${APP_PREFIX} ejecutado.`);
    }
};

// Exportación por defecto para compatibilidad
export default Store;
