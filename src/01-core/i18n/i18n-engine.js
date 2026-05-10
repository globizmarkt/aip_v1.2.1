// %[CARRIL-AIP-CORE] - [Fase 18.1]
/**
 * i18n-engine.js
 * Soberanía Lingüística y Gestión de Diccionarios.
 * R25 (Zero-DOM) | R18 (ES Modules) | R11 (Fiduciary Bus) | R27 (Immutability)
 */

const STORAGE_KEY = 'skeleton_lang';
const DEFAULT_LANG = 'en';

/**
 * i18nEngine: El custodio del lenguaje en la Órbita 1.
 * Pure Logic. Zero-DOM.
 */
export const i18nEngine = {
    
    /**
     * Obtiene el idioma activo desde el SSoT local (localStorage canónico).
     * @returns {string}
     */
    getLocale() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    },

    /**
     * Cambia el idioma activo y despacha la señal de sistema al bus fiduciario.
     * @param {string} lang - Código de idioma ('en', 'es', etc.)
     */
    setLocale(lang) {
        localStorage.setItem(STORAGE_KEY, lang);
        
        // Despacho fiduciario a nivel de documento (R11)
        const event = new CustomEvent('Skeleton:LocaleChanged', { 
            detail: { lang } 
        });
        document.dispatchEvent(event);
        
        console.log(`[i18nEngine] Soberanía lingüística actualizada a: ${lang.toUpperCase()}`);

        // Carga dinámica del diccionario tras cambio de locale
        this.loadDictionary(lang);
    },

    /**
     * Carga el diccionario JSON de la vertical activa y aplica hidratación al DOM.
     * Ruta dinámica: /src/verticals/${vertical}/locales/${lang}.json (COG-64)
     * @param {string} lang - Código de idioma ('en', 'es')
     */
    async loadDictionary(lang) {
        const vertical = window.Skeleton?.ENV?.vertical || '_base';
        const url = `/src/verticals/${vertical}/locales/${lang}.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`[i18nEngine] Diccionario no encontrado: ${url}`);
            const dict = await response.json();
            const sealed = this.seal(dict);
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.dataset.i18n;
                const value = key.split('.').reduce((o, k) => o?.[k], sealed);
                if (value !== undefined) el.textContent = value;
            });
            console.log(`[i18nEngine] Diccionario '${lang}' cargado desde ${url} — ${Object.keys(dict).length} namespaces activos.`);
            return sealed;
        } catch (error) {
            console.error(`[i18nEngine] Error cargando diccionario:`, error);
        }
    },

    /**
     * Sella un diccionario de forma profunda (Resolución G-17).
     * Garantiza que el objeto sea inmutable en toda la jerarquía.
     * @param {Object} obj - Diccionario JSON cargado.
     * @returns {Object} Diccionario inmutable.
     */
    seal(obj) {
        return this._deepFreeze(obj);
    },

    /**
     * Implementación recursiva de inmutabilidad profunda (Doctrina R27).
     * @private
     */
    _deepFreeze(obj) {
        // Recuperar todas las propiedades
        const propNames = Object.getOwnPropertyNames(obj);

        // Congelar cada propiedad si es un objeto (recursión)
        for (const name of propNames) {
            const value = obj[name];
            if (value && typeof value === "object") {
                this._deepFreeze(value);
            }
        }

        // Sellar el objeto raíz
        return Object.freeze(obj);
    }
};

export default i18nEngine;
