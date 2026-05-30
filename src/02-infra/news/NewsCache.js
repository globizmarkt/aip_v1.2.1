// %[CARRIL-AIP-INFRA-NEWS] - [INV-NEWS-01] - [VIBE-AIP-S-REBORN-03.4]
/**
 * NewsCache.js
 * Gestor de Persistencia de Noticias — TTL 1800 s (30 min).
 *
 * Doctrinas: R5 (Zero-Leak) | R10 (Storage Prefix) | R19 (Trazabilidad)
 *            R20 (Event-Driven) | INV-NEWS-01 (Caché Finnhub + RSS ECB/BIS)
 *
 * Claves canónicas:
 *   Caché maestra  : aip_news_cache_v1
 *   Checkpoints    : aip_news_checkpoint_{category}
 *
 * JSON Schema — entidad news_item (canónico):
 * {
 *   "id"       : string,          // UUID o hash de URL fuente
 *   "category" : "commodities" | "regulatory" | "capital" | "macro",
 *   "source"   : "finnhub" | "ecb_rss" | "bis_rss",
 *   "datetime" : string,          // ISO 8601 UTC (e.g. "2026-05-30T14:22:00Z")
 *   "title"    : string,
 *   "summary"  : string,
 *   "url"      : string,          // URL canónica de la fuente
 *   "raw"      : object | null    // Payload original de la fuente (debug/audit)
 * }
 *
 * Estructura de caché persistida bajo StorageAdapter:
 * {
 *   "version"   : 1,
 *   "fetchedAt" : number,         // Date.now() en ms
 *   "items"     : news_item[]
 * }
 */

import { StorageAdapter } from '../storage/StorageAdapter.js';

/** TTL canónico: 1800 segundos (30 minutos) */
const NEWS_TTL_MS = 1_800_000;

/** Clave maestra de caché (StorageAdapter la prefijará con APP_PREFIX) */
const CACHE_KEY = 'aip_news_cache_v1';

/** Categorías autorizadas — sincronizadas con GADGET_02_LAND filtros */
const VALID_CATEGORIES = Object.freeze(['commodities', 'regulatory', 'capital', 'macro']);

/** Fuentes autorizadas — INV-NEWS-01 */
const VALID_SOURCES = Object.freeze(['finnhub', 'ecb_rss', 'bis_rss']);

/**
 * Genera la clave de checkpoint por categoría.
 * @param {string} category
 * @returns {string}
 */
const checkpointKey = (category) => `aip_news_checkpoint_${category}`;

/**
 * NewsCache — API pública.
 * Singleton: exportado como instancia (patrón StorageAdapter / TabLoader).
 */
class NewsCacheEngine {

    /**
     * ¿La caché maestra existe y está dentro del TTL?
     * @returns {boolean}
     */
    isValid() {
        const cached = StorageAdapter.get(CACHE_KEY);
        if (!cached || typeof cached.fetchedAt !== 'number') return false;
        return (Date.now() - cached.fetchedAt) < NEWS_TTL_MS;
    }

    /**
     * Devuelve los items de la caché maestra (sin validar TTL).
     * Usar junto con isValid() antes de llamar a esta función.
     * @returns {object[]|null} Array de news_item o null si no existe.
     */
    get() {
        const cached = StorageAdapter.get(CACHE_KEY);
        return cached?.items ?? null;
    }

    /**
     * Devuelve items filtrados por categoría desde la caché maestra.
     * @param {string} category — debe estar en VALID_CATEGORIES
     * @returns {object[]|null}
     */
    getByCategory(category) {
        if (!VALID_CATEGORIES.includes(category)) {
            console.warn(`[NewsCache] Categoría no autorizada: ${category}`);
            return null;
        }
        const items = this.get();
        if (!items) return null;
        return items.filter(item => item.category === category);
    }

    /**
     * Persiste el array de news_items en la caché maestra.
     * Valida la estructura mínima antes de escribir (R0 — Zero Trust).
     * @param {object[]} items — array de news_item
     * @returns {boolean} true si se guardó correctamente
     */
    set(items) {
        if (!Array.isArray(items)) {
            console.error('[NewsCache] set() requiere un array de news_item.');
            return false;
        }

        // Validación estructural mínima de cada item (R0)
        const validated = items.filter(item => {
            const ok = item
                && typeof item.id       === 'string'
                && typeof item.title    === 'string'
                && typeof item.datetime === 'string'
                && VALID_CATEGORIES.includes(item.category)
                && VALID_SOURCES.includes(item.source);
            if (!ok) console.warn('[NewsCache] Item descartado por schema inválido:', item);
            return ok;
        });

        const payload = {
            version:   1,
            fetchedAt: Date.now(),
            items:     validated,
        };

        const ok = StorageAdapter.set(CACHE_KEY, payload);
        if (ok) {
            console.log(`[NewsCache] Caché actualizada — ${validated.length} items · TTL ${NEWS_TTL_MS / 60_000} min.`);
        }
        return ok;
    }

    /**
     * Invalida la caché maestra (fuerza refresco en próxima lectura).
     */
    invalidate() {
        StorageAdapter.remove(CACHE_KEY);
        console.log('[NewsCache] Caché invalidada manualmente.');
    }

    /**
     * Devuelve el checkpoint persistido para una categoría dada.
     * Útil para refresco incremental por feed.
     * @param {string} category
     * @returns {object|null} — { lastId: string, fetchedAt: number } o null
     */
    getCheckpoint(category) {
        if (!VALID_CATEGORIES.includes(category)) return null;
        return StorageAdapter.get(checkpointKey(category));
    }

    /**
     * Persiste el checkpoint de última recuperación para una categoría.
     * @param {string} category
     * @param {string} lastId — ID del último item procesado
     */
    setCheckpoint(category, lastId) {
        if (!VALID_CATEGORIES.includes(category)) {
            console.warn(`[NewsCache] Checkpoint ignorado — categoría inválida: ${category}`);
            return;
        }
        StorageAdapter.set(checkpointKey(category), { lastId, fetchedAt: Date.now() });
    }

    /**
     * Refresco asíncrono en segundo plano.
     * Dispara una solicitud sin bloquear el hilo principal.
     * El caller debe proporcionar la función fetchFn que resuelve a news_item[].
     *
     * Patrón de uso:
     *   NewsCache.backgroundRefresh(async () => await myFetchFn());
     *
     * @param {function(): Promise<object[]>} fetchFn
     */
    backgroundRefresh(fetchFn) {
        if (typeof fetchFn !== 'function') {
            console.error('[NewsCache] backgroundRefresh() requiere una función asíncrona.');
            return;
        }
        // Disparo fire-and-forget (no await en el caller)
        Promise.resolve()
            .then(async () => {
                console.log('[NewsCache] Refresco asíncrono iniciado (segundo plano)…');
                const items = await fetchFn();
                this.set(items);
                // Notificar al bus que la caché fue actualizada (R20)
                document.dispatchEvent(new CustomEvent('Skeleton:News:CacheRefreshed', {
                    detail: Object.freeze({ count: items.length }),
                    bubbles: false,
                }));
            })
            .catch(err => {
                console.error('[NewsCache] Error en refresco asíncrono:', err);
                // No lanzar — error silencioso para no interrumpir el hilo principal
            });
    }

    /**
     * Schema de referencia (solo lectura) — documentación viva para el bus de integración.
     */
    get SCHEMA() {
        return Object.freeze({
            id:       'string',
            category: VALID_CATEGORIES,
            source:   VALID_SOURCES,
            datetime: 'ISO8601 UTC string',
            title:    'string',
            summary:  'string',
            url:      'string',
            raw:      'object | null',
        });
    }

    /**
     * TTL canónico en milisegundos (solo lectura).
     */
    get TTL_MS() { return NEWS_TTL_MS; }
}

export const NewsCache = new NewsCacheEngine();
export default NewsCache;
