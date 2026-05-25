// %[CARRIL-AIP-GADGET] - [TICKER-01] - [VIBE-AIP-S-REBORN-03.4]
/**
 * aip-ticker.js
 * Web Component Light DOM — Ticker de mercado del footer de landing.
 *
 * Resolución: E4-T00.3 — Nodo ticker extraído del Hueso (index.html)
 *             y encapsulado como gadget independiente.
 *
 * Doctrina:
 *   R2  (Light DOM) — attachShadow() PROHIBIDO. this.innerHTML en Light DOM.
 *   R18 (ES Module) — sin IIFE, sin globals.
 *   R-GADGET-01 — Clases Tailwind y tokens visuales migrados INTACTOS
 *                  del bloque original. Cero alteración estética.
 *
 * DT-AIP-05 (nota de intención):
 *   El template es 100% estático interno — cero datos externos, riesgo XSS = 0.
 *   Cuando el ticker se electrifique con feeds reales, sustituir el bloque
 *   ticker-content por inyección via createElement + textContent sobre el payload
 *   dinámico, manteniendo este wrapper intacto.
 *
 * Uso en index.html:
 *   <aip-ticker class="w-full lg:w-1/3 flex justify-center"></aip-ticker>
 *
 * Dependencias visuales (heredadas del scope global — Light DOM):
 *   - .ticker-wrap / .ticker-content / @keyframes marquee → theme-landing.css
 *   - --stitch-gold / --stitch-border / --stitch-bg-dark  → theme-landing.css
 *   - .stitch-drawer                                       → theme-landing.css
 */

class AipTicker extends HTMLElement {

    connectedCallback() {
        // [R-GADGET-01] Marcado visual idéntico al bloque original de index.html.
        // Las clases Tailwind, los tokens CSS y la estructura DOM se preservan intactos.
        this.innerHTML = `
            <div class="relative w-full max-w-sm stitch-drawer rounded-sm border border-[var(--stitch-border)]/50 overflow-hidden">
                <div class="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0C121A] to-transparent z-10"></div>
                <div class="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0C121A] to-transparent z-10"></div>
                <div class="py-3 flex items-center justify-center ticker-wrap w-full overflow-hidden whitespace-nowrap">
                    <div class="ticker-content text-[var(--stitch-gold)] font-mono text-[10px] tracking-wider opacity-90">
                        XAU/USD $2,340 (+0.4%) &nbsp;&bull;&nbsp; BTC/USD $64,200 (-1.2%) &nbsp;&bull;&nbsp; EUR/CHF 0.98 (+0.1%)
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('aip-ticker', AipTicker);
