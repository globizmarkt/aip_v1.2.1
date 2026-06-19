// %[CARRIL-AIP-CORE] - [Fase 18.1]
/**
 * i18n-engine.js
 * Soberanía Lingüística y Gestión de Diccionarios.
 * R25 (Zero-DOM) | R18 (ES Modules) | R11 (Fiduciary Bus) | R27 (Immutability)
 */

import { deepFreeze } from '../utils/deepFreeze.js'; // [E3-GENESIS] E3-T08 — canónico R27

const STORAGE_KEY = 'skeleton_lang';
const DEFAULT_LANG = 'es'; // [B1-H1] Selector visual mostraba ES — default alineado (VR-REBORN-08)

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
     * Carga el diccionario JSON de la vertical activa.
     * Ruta namespaced canónica (R26): /src/verticals/${vertical}/locales/${lang}/ui.json
     * La hidratación del DOM es responsabilidad de ui-hydrator.js (R25/R28).
     * @param {string} lang - Código de idioma ('en', 'es', 'fr', 'pt')
     */
    async loadDictionary(lang) {
        const vertical = window.Skeleton?.ENV?.vertical || '_base';
        const url = `/src/verticals/${vertical}/locales/${lang}/ui.json`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`[i18nEngine] Diccionario no encontrado: ${url}`);
            const dict = await response.json();
            this._dict = Object.freeze(dict); // Sella la fuente de verdad (R27)
            console.log(`[i18nEngine] Diccionario '${lang}' cargado — Namespaces activos.`);

            // Señal de diccionario listo para que la capa de interfaz consuma (R11/R20)
            document.dispatchEvent(new CustomEvent('Skeleton:DictionaryReady', {
                detail: { lang, dict: this._dict }
            }));

            return this._dict;
        } catch (error) {
            console.error(`[i18nEngine] Error cargando diccionario:`, error);
            throw error;
        }
    },

    /**
     * Resuelve una clave dot-notation sobre el diccionario activo (COG-66).
     * Fallback: devuelve la propia key como string visible (Fail-Secure, COG-11).
     * @param {string} key - Clave dot-notation, ej: 'crm.row.grade'
     * @returns {string}
     */
    t(key) {
        if (!this._dict) return key;
        return key.split('.').reduce((o, k) => o?.[k], this._dict) ?? key;
    },

    /**
     * Sella un diccionario de forma profunda (Resolución G-17).
     * Garantiza que el objeto sea inmutable en toda la jerarquía.
     * @param {Object} obj - Diccionario JSON cargado.
     * @returns {Object} Diccionario inmutable.
     */
    seal(obj) {
        return deepFreeze(obj); // [E3-GENESIS] E3-T08 — usa canónico importado
    }
};

export default i18nEngine;
