// %[CARRIL-AIP-GADGET] - [TICKER-01] - [VIBE-AIP-S-REBORN-03.4]
/**
 * aip-ticker.js
 * Web Component Light DOM — Ticker de mandatos activos del footer de landing.
 *
 * Resolución: E4-T00.3 — Nodo ticker extraído del Hueso (index.html)
 *             y encapsulado como gadget independiente.
 * Electrificación: E4-T05 — Conectado a mockState.mandates (store).
 *
 * Doctrina:
 *   R2  (Light DOM) — attachShadow() PROHIBIDO.
 *   R18 (ES Module) — sin IIFE, sin globals.
 *   R-GADGET-01 — Clases Tailwind y tokens visuales migrados INTACTOS
 *                  del bloque original. Cero alteración estética.
 *   DT-AIP-05 — createElement + textContent para datos dinámicos.
 *
 * Uso en index.html:
 *   <aip-ticker class="w-full lg:w-1/3 flex justify-center"></aip-ticker>
 *
 * Dependencias visuales (heredadas del scope global — Light DOM):
 *   - .ticker-wrap / .ticker-content / @keyframes marquee → theme-landing.css
 *   - --stitch-gold / --stitch-border / --stitch-bg-dark  → theme-landing.css
 *   - .stitch-drawer                                       → theme-landing.css
 *
 * Fuente de datos: window.Skeleton.store.getState().mandates
 * Reactividad: escucha Skeleton:store:updated para re-render.
 */

class AipTicker extends HTMLElement {

    connectedCallback() {
        // [R-GADGET-01] Estructura visual idéntica al bloque original.
        // Construcción via createElement para cumplir DT-AIP-05 con datos dinámicos.
        this._buildShell();
        this._renderFromStore();

        // Reactividad: re-renderizar cuando el store emita actualización
        this._onStoreUpdated = () => this._renderFromStore();
        document.addEventListener('Skeleton:store:updated', this._onStoreUpdated);
    }

    disconnectedCallback() {
        if (this._onStoreUpdated) {
            document.removeEventListener('Skeleton:store:updated', this._onStoreUpdated);
            this._onStoreUpdated = null;
        }
    }

    /**
     * Construye el wrapper visual del ticker (idéntico al bloque original).
     * El contenido de ticker-content se popula después vía _populateTicker.
     * @private
     */
    _buildShell() {
        this.textContent = '';

        const wrap = document.createElement('div');
        wrap.className = 'relative w-full max-w-sm stitch-drawer rounded-sm border border-[var(--stitch-border)]/50 overflow-hidden';

        const fadeLeft = document.createElement('div');
        fadeLeft.className = 'absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0C121A] to-transparent z-10';

        const fadeRight = document.createElement('div');
        fadeRight.className = 'absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0C121A] to-transparent z-10';

        const track = document.createElement('div');
        track.className = 'py-3 flex items-center justify-center ticker-wrap w-full overflow-hidden whitespace-nowrap';

        const content = document.createElement('div');
        content.className = 'ticker-content text-[var(--stitch-gold)] font-mono text-[10px] tracking-wider opacity-90';
        content.setAttribute('data-ticker-content', '');

        track.appendChild(content);
        wrap.append(fadeLeft, fadeRight, track);
        this.appendChild(wrap);
    }

    /**
     * Lee el estado del store y dispara el render del ticker.
     * Degrada a fallback estático si window.Skeleton.store no está disponible.
     * @private
     */
    _renderFromStore() {
        const state = window.Skeleton?.store?.getState?.() || {};
        const activeMandates = this._getActiveMandates(state);
        this._populateTicker(activeMandates);
    }

    /**
     * Filtra mandatos activos del estado.
     * NOTA: el spec indica m.status === 'active' pero mockState no tiene
     * campo 'status'. Se usa !m.locked como proxy práctico (E4-T05-OBS-01).
     * @param {Object} state
     * @returns {Array}
     * @private
     */
    _getActiveMandates(state) {
        const mandates = state.mandates || [];
        return mandates.filter(m => !m.locked);
    }

    /**
     * Inyecta los labels de mandatos en el nodo ticker-content.
     * DT-AIP-05: usa textContent, nunca innerHTML con datos externos.
     * @param {Array} mandates
     * @private
     */
    _populateTicker(mandates) {
        const el = this.querySelector('[data-ticker-content]');
        if (!el) return;
        el.textContent = '';

        if (mandates.length === 0) {
            el.appendChild(document.createTextNode('AIP FINANCIAL & COMMODITIES  •  INSTITUTIONAL ACCESS'));
            return;
        }

        const labels = [];
        for (let i = 0; i < mandates.length; i++) {
            labels.push(this._buildMandateLabel(mandates[i]));
        }

        el.appendChild(document.createTextNode(labels.join('  •  ')));
    }

    /**
     * Extrae el label de un mandato para el ticker.
     * Prioridad: ticker_label → asset.class + fiduciaryState → mandateId
     * NOTA: mockState v1.3.1 no tiene campo ticker_label (E4-T05-OBS-02).
     * @param {Object} mandate
     * @returns {string}
     * @private
     */
    _buildMandateLabel(mandate) {
        if (mandate.ticker_label) return mandate.ticker_label;

        const name = mandate.asset?.class || mandate.mandateId || '—';
        const state = mandate.fiduciaryState || '';
        return state ? `${name} · ${state}` : name;
    }
}

customElements.define('aip-ticker', AipTicker);
