/**
 * LuxI18n - Sovereign Translation Engine
 * Enforces R4 (Strict i18n) - Zero hardcoded text.
 * Async hydration from external JSON dictionaries.
 */

export const I18n = {
    currentLocale: 'es', // Default locale
    translations: {},    // Caches loaded locales: { 'es': {...}, 'en': {...} }

    async init() {
        // Recupera la preferencia de idioma persistida (La Mochila)
        const prefix = window.APP_PREFIX || 'AIP_LANDING_V0_';
        const saved = sessionStorage.getItem(`${prefix}locale`);
        if (saved) this.currentLocale = saved;

        await this.loadLocale(this.currentLocale);
        this.translatePage();

        // Escucha cambios de idioma desde el selector del Header
        document.addEventListener('Skeleton:LangChange', async (e) => {
            const { lang } = e.detail;
            if (lang && lang !== this.currentLocale) {
                const prefix = window.APP_PREFIX || 'AIP_LANDING_V0_';
                sessionStorage.setItem(`${prefix}locale`, lang);
                await this.setLocale(lang);
                console.log(`[I18n] Idioma cambiado a: ${lang}`);
            }
        });

        // Escucha detección de arquetipo para re-hidratar (R29)
        document.addEventListener('Skeleton:ArchetypeDetected', (e) => {
            console.log(`[I18n] Arquetipo detectado (${e.detail.archetype}). Re-hidratando contenidos.`);
            this.translatePage();
        });

        console.log(`[I18n] Inicializado. Locale: ${this.currentLocale}`);
    },

    async loadLocale(locale) {
        if (this.translations[locale]) {
            return; // Already loaded
        }
        
        try {
            const response = await fetch(`src/locales/${locale}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.translations[locale] = data;
        } catch (error) {
            console.error(`[I18n] Fallo al cargar diccionario '${locale}'.`, error);
            this.translations[locale] = {};
        }
    },

    async setLocale(locale) {
        this.currentLocale = locale;
        await this.loadLocale(locale);
        this.translatePage();
    },

    translatePage() {
        const dictionary = this.translations[this.currentLocale];
        if (!dictionary) return;

        // Translate inner text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this._resolveKey(dictionary, key);
            if (translation) el.innerText = translation;
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this._resolveKey(dictionary, key);
            if (translation) el.placeholder = translation;
        });

        // Translate ARIA labels (R4 Compliance)
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            const translation = this._resolveKey(dictionary, key);
            if (translation) el.setAttribute('aria-label', translation);
        });

        // 4. Hidratación Específica por Arquetipo (R29)
        const prefix = window.APP_PREFIX || 'AIP_LANDING_V0_';
        const savedArchetype = sessionStorage.getItem(`${prefix}archetype`);
        if (savedArchetype) {
            this.applyArchetypeOverrides(savedArchetype);
        }
    },

    /**
     * Aplica overrides de contenido basados en el arquetipo detectado.
     * Busca en el diccionario: archetypes.[archetype].[key]
     */
    applyArchetypeOverrides(archetype) {
        const dictionary = this.translations[this.currentLocale];
        if (!dictionary || !dictionary.archetypes) return;

        const overrides = dictionary.archetypes[archetype.toLowerCase()];
        if (!overrides) return;

        console.log(`[I18n] Aplicando overrides para arquetipo: ${archetype}`);
        
        document.querySelectorAll('[data-i18n-archetype]').forEach(el => {
            const key = el.getAttribute('data-i18n-archetype');
            if (overrides[key]) {
                el.innerText = overrides[key];
            }
        });
    },

    t(key) {
        const dictionary = this.translations[this.currentLocale] || {};
        return this._resolveKey(dictionary, key) || key;
    },

    _resolveKey(obj, path) {
        if (obj[path]) return obj[path];
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : null;
        }, obj);
    }
};

// Mantener acceso global para debugging pero permitir importación modular
window.LuxI18n = I18n;
export default I18n;
