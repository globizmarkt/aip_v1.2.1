// %[CARRIL-AIP-TABLOADER] - [TAB-INJ-01] - [VIBE-AIP-S-REBORN-02]
/**
 * TabLoader.js
 * Mecanismo de inyección de gadgets de landing en #tab-content-container.
 * Escucha Skeleton:Action:TabNavigate (emitido por Router al traducir Tab*Click)
 * y carga el fragmento gadgets/landing/${slug}/code.html en el DOM.
 *
 * Doctrina: R18 (ES Modules) | R20 (Event-Driven) | R25 (gadgets = sensores ciegos)
 *           R28 (Desacoplamiento) | R19 (Trazabilidad)
 *
 * Flujo canónico:
 *   [data-action="Tab*Click"] → UIBinder → Skeleton:RequestGate
 *   → Router (SEMANTIC_MAP) → Skeleton:Action:TabNavigate { tab: slug }
 *   → TabLoader.#load() → fetch gadgets/landing/${slug}/code.html
 *   → innerHTML en #tab-content-container, ocultar #orbit-2-main-content
 */

/**
 * Slugs de landing autorizados (lista blanca explícita — R0).
 * Debe sincronizarse con gadgets/landing/ en disco.
 */
const ALLOWED_SLUGS = Object.freeze({
    'about-aip':    true,
    'our-services': true,
    'markets':      true,
    'intelligence': true,
    'regulatory':   true,
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
        console.log('[TabLoader] Mecanismo de inyección de tabs activo — 5 slugs autorizados.');
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

        // Idempotencia: mismo tab activo → no recargar
        if (this.#currentSlug === slug) return;

        this.#currentSlug = slug;

        // Estado de carga — placeholder fiduciario
        this.#renderContainer(
            `<div class="py-16 text-center text-on-surface-variant text-xs font-mono tracking-[0.3em] uppercase opacity-40">
                Cargando ${slug}&hellip;
            </div>`
        );

        try {
            // Cache hit → render inmediato sin fetch
            if (!this.#cache[slug]) {
                const res = await fetch(`/gadgets/landing/${slug}/code.html`);
                if (!res.ok) throw new Error(`HTTP ${res.status} al cargar "${slug}"`);
                this.#cache[slug] = await res.text();
            }

            this.#renderContainer(this.#cache[slug]);
            console.log(`[TabLoader] ${slug} → inyectado en #tab-content-container (${this.#cache[slug].length} chars).`);

        } catch (err) {
            this.#currentSlug = null; // Permite reintentar en próximo click
            console.error('[TabLoader] Error cargando gadget:', err);
            this.#renderContainer(
                `<div class="py-12 px-8 border border-red-500/20 bg-red-950/10 rounded-sm">
                    <p class="text-red-400 text-xs font-mono tracking-wider uppercase mb-2">Error de carga</p>
                    <p class="text-on-surface-variant text-xs font-mono">${err.message}</p>
                </div>`
            );
        }
    }

    /**
     * Inyecta HTML en el contenedor y gestiona la visibilidad orbit-2.
     * @param {string} html
     */
    #renderContainer(html) {
        this.#container.innerHTML = html;
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
