// %[CARRIL-AIP-INFRA] - [Fase 18.2]
/**
 * StorageAdapter.js
 * Adaptador de Persistencia con Aislamiento Estricto.
 * Doctrinas: R5 (Zero-Leak) | R10 (Storage Prefix)
 */

let APP_PREFIX = 'SKELETON_DEFAULT_';

/**
 * StorageAdapter: El guardián de los datos persistentes en la Órbita 2.
 * Proporciona una interfaz agnóstica para localStorage y sessionStorage.
 */
export const StorageAdapter = {
    
    /**
     * Inicializa el adaptador con el prefijo soberano de la vertical.
     * @param {string} prefix - Prefijo de la vertical (ej. 'AIP_V1_')
     */
    init(prefix) {
        if (prefix) APP_PREFIX = prefix;
        console.log(`[StorageAdapter] Aislamiento activado bajo el prefijo: ${APP_PREFIX}`);
    },
    
    /**
     * Almacena un dato de forma segura y serializada.
     * @param {string} key - Clave base (se prefijará automáticamente).
     * @param {any} value - Valor a guardar (serializado a JSON).
     * @param {string} type - 'local' (localStorage) o 'session' (sessionStorage).
     */
    set(key, value, type = 'local') {
        const fullKey = `${APP_PREFIX}${key}`;
        const storage = type === 'session' ? sessionStorage : localStorage;
        
        try {
            const serialized = JSON.stringify(value);
            storage.setItem(fullKey, serialized);
            return true;
        } catch (e) {
            console.error(`[StorageAdapter] Error al guardar ${key}:`, e);
            return false;
        }
    },

    /**
     * Recupera un dato y lo deserializa automáticamente.
     * @param {string} key - Clave base.
     * @param {string} type - 'local' o 'session'.
     * @returns {any|null}
     */
    get(key, type = 'local') {
        const fullKey = `${APP_PREFIX}${key}`;
        const storage = type === 'session' ? sessionStorage : localStorage;
        const data = storage.getItem(fullKey);
        
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn(`[StorageAdapter] Corrupción de datos detectada en ${key}, devolviendo null.`);
            return null;
        }
    },

    /**
     * Elimina una clave del almacenamiento bajo el prefijo soberano.
     * @param {string} key - Clave base.
     * @param {string} type - 'local' o 'session'.
     */
    remove(key, type = 'local') {
        const fullKey = `${APP_PREFIX}${key}`;
        const storage = type === 'session' ? sessionStorage : localStorage;
        storage.removeItem(fullKey);
    },

    /**
     * Purga todas las claves que comiencen con el prefijo de la aplicación.
     * @param {string} type - 'local' o 'session'.
     */
    purge(type = 'local') {
        const storage = type === 'session' ? sessionStorage : localStorage;
        Object.keys(storage).forEach(fullKey => {
            if (fullKey.startsWith(APP_PREFIX)) {
                storage.removeItem(fullKey);
            }
        });
        console.warn(`[StorageAdapter] Purgado integral del espacio ${APP_PREFIX} (${type}) ejecutado.`);
    }
};

export default StorageAdapter;
