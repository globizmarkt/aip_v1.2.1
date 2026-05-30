// %[CARRIL-AIP-TABLOADER] - [TAB-INJ-01] - [VIBE-AIP-S-REBORN-02]
// DT-AIP-05 RESUELTO — VIBE-AIP-S-REBORN-03.5 · 2026-05-26
// innerHTML con datos externos extirpado. Sanitizador Zero-Trust (#sanitizeExternal) activo.
/**
 * TabLoader.js
 * Mecanismo de inyección de gadgets de landing en #tab-content-container.
 * Escucha Skeleton:Action:TabNavigate (emitido por Router al traducir Tab*Click)
 * y carga el fragmento gadgets/landing/${slug}/code.html en el DOM.
 *
 * Doctrina: R18 (ES Modules) | R20 (Event-Driven) | R25 (gadgets = sensores ciegos)
 *           R28 (Desacoplamiento) | R19 (Trazabilidad)
 *           DT-AIP-05 (XSS Zero-Trust — createElement + sanitizeExternal)
 *
 * Flujo canónico:
 *   [data-action="Tab*Click"] → UIBinder → Skeleton:RequestGate
 *   → Router (SEMANTIC_MAP) → Skeleton:Action:TabNavigate { tab: slug }
 *   → TabLoader.#load() → fetch gadgets/landing/${slug}/code.html
 *   → #sanitizeExternal() → DocumentFragment → #tab-content-container
 *   ocultar #orbit-2-main-content
 */

/**
 * Slugs de landing autorizados (lista blanca explícita — R0).
 * Debe sincronizarse con gadgets/landing/ en disco.
 *
 * [LAND-05/06/07/08] Slugs canónicos post-DEC-LAND-01 — 2026-05-30
 * Deprecados: about-aip, our-services (fusionados en about-us)
 *             markets → news, intelligence → opportunity
 */
const ALLOWED_SLUGS = Object.freeze({
    '__main__':     true,   // [TAB-INJ-01] Slug especial — restaura orbit-2-main-content (NavInicio)
    'about-us':     true,   // [LAND-07] Fusión about-aip + our-services
    'news':         true,   // [LAND-06] Renombrado desde markets
    'opportunity':  true,   // [LAND-08] Renombrado desde intelligence
    'regulatory':   true,
    'aip-ventures': true,   // [LAND-01] Tab #6 — AIP Ventures
});

class TabLoaderEngine {
    #container   = null;  // #tab-content-container
    #mainContent = null;  // #orbit-2-main-content
    #currentSlug = null;  // Slug activo (evita recargas innecesarias)
    #cache       = {};    // HTML cacheado por slug (R19: no refetch en sesión)

    /**
     * Inicializa el motor y enlaza el listener del bus de eventos.
     * Invocar después de Router.init() en la cascada de arranque.
     */
    init() {
        this.#container  = document.getElementById('tab-content-container');
        this.#mainContent = document.getElementById('orbit-2-main-content');

        if (!this.#container || !this.#mainContent) {
            console.warn('[TabLoader] Contenedores DOM ausentes (#tab-content-container / #orbit-2-main-content) — inyección desactivada.');
            return;
        }

        document.addEventListener('Skeleton:Action:TabNavigate', (e) => this.#load(e));
        console.log('[TabLoader] Mecanismo de inyección de tabs activo — 6 slugs autorizados (post-DEC-LAND-01).');
    }

    /**
     * Carga y renderiza el gadget correspondiente al slug del evento.
     * @param {CustomEvent} e — detail: { tab: string }
     */
    async #load(e) {
        const slug = e.detail?.tab;

        // Validación de slug (R0 — Zero Trust)
        if (!slug || !ALLOWED_SLUGS[slug]) {
            console.warn('[TabLoader] Slug no autorizado o ausente:', slug);
            return;
        }

        // [TAB-INJ-01] Caso especial __main__: restaurar orbit-2-main-content (NavInicio)
        if (slug === '__main__') {
            this.#showMain();
            return;
        }

        // Idempotencia: mismo tab activo → no recargar
        if (this.#currentSlug === slug) return;

        this.#currentSlug = slug;

        // [TAB-INJ-01 · PASO C] Inhibición visual: clase de estado de carga sobre el contenedor
        this.#container.classList.add('tab-content-container--loading');

        // Estado de carga — placeholder fiduciario (DT-AIP-05: createElement — sin innerHTML)
        const loadingEl = document.createElement('div');
        loadingEl.className = 'py-16 text-center text-on-surface-variant text-xs font-mono tracking-[0.3em] uppercase opacity-40';
        loadingEl.textContent = `Cargando ${slug}…`;
        this.#renderContainer(loadingEl);

        try {
            // Cache hit → render inmediato sin fetch
            if (!this.#cache[slug]) {
                const res = await fetch(`/gadgets/landing/${slug}/code.html`);
                if (!res.ok) throw new Error(`HTTP ${res.status} al cargar "${slug}"`);
                this.#cache[slug] = await res.text();
            }

            // DT-AIP-05: Sanitizar HTML externo antes de inyectar — nunca innerHTML directo
            this.#renderContainer(TabLoaderEngine.#sanitizeExternal(this.#cache[slug]));
            // [PASO C] Levantar inhibición visual tras render exitoso
            this.#container.classList.remove('tab-content-container--loading');
            console.log(`[TabLoader] ${slug} → inyectado en #tab-content-container (${this.#cache[slug].length} chars, sanitizado).`);

        } catch (err) {
            this.#currentSlug = null; // Permite reintentar en próximo click
            // [PASO C] Levantar inhibición visual en caso de error también
            this.#container.classList.remove('tab-content-container--loading');
            console.error('[TabLoader] Error cargando gadget:', err);
            // DT-AIP-05: err.message es dato externo — usar textContent, nunca interpolación en innerHTML
            const errWrap  = document.createElement('div');
            errWrap.className = 'py-12 px-8 border border-red-500/20 bg-red-950/10 rounded-sm';
            const errTitle = document.createElement('p');
            errTitle.className = 'text-red-400 text-xs font-mono tracking-wider uppercase mb-2';
            errTitle.textContent = 'Error de carga';
            const errMsg   = document.createElement('p');
            errMsg.className = 'text-on-surface-variant text-xs font-mono';
            errMsg.textContent = err.message;
            errWrap.appendChild(errTitle);
            errWrap.appendChild(errMsg);
            this.#renderContainer(errWrap);
        }
    }

    /**
     * Sanitizador Zero-Trust para HTML externo (DT-AIP-05).
     * Parsea en contexto aislado (DOMParser), expurga <script> y atributos on*,
     * retorna un DocumentFragment con nodos saneados listos para importar al DOM.
     * @param {string} rawHtml — HTML crudo de servidor (nunca de confianza implícita)
     * @returns {DocumentFragment}
     */
    static #sanitizeExternal(rawHtml) {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(rawHtml, 'text/html');

        // Expurgar <script> — por política R0 aunque DOMParser no los ejecuta
        doc.querySelectorAll('script').forEach(el => el.remove());

        // Expurgar atributos de evento inline (onerror, onclick, onload…)
        const DANGEROUS_ATTR = /^on[a-z]/i;
        doc.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes)
                .filter(attr => DANGEROUS_ATTR.test(attr.name))
                .forEach(attr => el.removeAttribute(attr.name));
        });

        // Construir DocumentFragment con nodos saneados importados al documento activo
        const frag = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node =>
            frag.appendChild(document.importNode(node, true))
        );
        return frag;
    }

    /**
     * [TAB-INJ-01] Restaura la vista principal (INICIO / orbit-2-main-content).
     * Invocado exclusivamente cuando slug === '__main__' (NavInicio).
     * Complemento simétrico de #renderContainer().
     */
    #showMain() {
        this.#container.replaceChildren();          // Vaciar gadget activo
        this.#container.classList.add('hidden');    // Ocultar contenedor de tab
        this.#mainContent.classList.remove('hidden'); // Mostrar orbit-2-main-content
        this.#currentSlug = null;                   // Resetear slug activo
        console.log('[TabLoader] NavInicio → orbit-2-main-content restaurado.');
    }

    /**
     * Monta content en el contenedor y gestiona la visibilidad orbit-2.
     * @param {Node|DocumentFragment} content — nodo DOM saneado (nunca string externo)
     */
    #renderContainer(content) {
        // DT-AIP-05: replaceChildren — acepta nodos DOM, nunca strings externos
        this.#container.replaceChildren(content);
        // Ocultar contenido principal de landing
        this.#mainContent.classList.add('hidden');
        // Mostrar contenedor de tab
        this.#container.classList.remove('hidden');
        // Scroll to top (UX fiduciaria — el usuario comienza desde arriba del gadget)
        document.getElementById('orbit-2')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

export const TabLoader = new TabLoaderEngine();
export default TabLoader;
