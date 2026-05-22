/**
 * ui-hydrator.js
 * Agente de interfaz encargado de la hidratación no destructiva del DOM.
 * Cumple estrictamente con R4, R11, R20 y R25 (Zero-DOM en Core).
 * Autor: Junior Dev-Kimi / Validado por Sentinel
 */
import i18nEngine from '../01-core/i18n/i18n-engine.js';

export const UIHydrator = {
    init() {
        // Escucha las señales canónicas de actualización de idioma (R20)
        document.addEventListener('Skeleton:DictionaryReady', () => this.hydrateAll());
        document.addEventListener('Skeleton:LocaleChanged', () => this.hydrateAll());
    },

    hydrateAll() {
        const dict = i18nEngine._dict;
        if (!dict) return;

        // Selector unificado para textos y placeholders de formularios
        document.querySelectorAll('[data-i18n], [data-i18n-placeholder]').forEach(el => {
            this._hydrateNode(el, dict);
        });
    },

    _hydrateNode(el, dict) {
        // --- Hidratación de contenido de texto seguro (R4) ---
        const i18nKey = el.dataset.i18n;
        if (i18nKey !== undefined) {
            const value = i18nKey.split('.').reduce((o, k) => o?.[k], dict);
            const resolved = value !== undefined ? value : '—'; // Fallback em dash canónico

            const hasElementChildren = Array.from(el.childNodes).some(n => n.nodeType === 1);
            if (!hasElementChildren) {
                // Nodo plano (option, span simple, p vacío): inyección directa
                el.textContent = resolved;
            } else {
                // Nodo complejo (label con inputs, button con iconos): mutar SOLO nodos de texto tipo 3
                el.childNodes.forEach(node => {
                    if (node.nodeType === 3) {
                        node.textContent = resolved;
                    }
                });
            }
        }

        // --- Hidratación adaptativa de placeholders en formularios ---
        const placeholderKey = el.dataset.i18nPlaceholder;
        if (placeholderKey !== undefined) {
            const value = placeholderKey.split('.').reduce((o, k) => o?.[k], dict);
            const resolved = value !== undefined ? value : '—';
            el.setAttribute('placeholder', resolved);
        }
    }
};

// Auto-ignición del escucha de interfaz
UIHydrator.init();
export default UIHydrator;
