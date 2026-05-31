// ============================================================================
// aip-orbit1-tree.js
// CRM Órbita 1 — Árbol de Mandatos (Domain → Category → Mandate)
// ============================================================================
// ÉPICA    : E5 — CRM Shell · Órbita 1 Navigation Tree
// TICKET   : E5-GADGET-7.4 (Ruta A — Forja directa)
// AGENTE   : Claude Code (Sentinel)
// DOCTRINA : R2 (Light DOM — attachShadow PROHIBIDO)
//            R3 (Zero-Hex — solo CSS variables en estilos)
//            R20 (Event-Driven — bus canónico CustomEvents)
//            R25 (Sensores ciegos — sin lógica de negocio)
//            R27 (Object.freeze — inmutabilidad de contrato)
//            R28 (Desacoplamiento — eventos, no llamadas directas)
//            DT-AIP-05 (XSS Zero-Trust — textContent, nunca innerHTML externo)
// SESIÓN   : VIBE-AIP-S-REBORN-03.4 · 2026-05-30
// ============================================================================
//
// SDD — Especificación Técnica
// ─────────────────────────────────────────────────────────────────────────────
//
// PROPÓSITO
//   Árbol de navegación de 3 niveles para el panel Órbita 1 del CRM Dashboard.
//   Renderiza la taxonomía fiduciaria de AIP (Dominios → Categorías → Mandatos)
//   y emite eventos en el bus canónico cuando el usuario navega.
//
// NIVELES DEL ÁRBOL (R-ARCH-100 · notas_04.3 L1080-1180)
//   L1 — Dominio    : 3 nodos fijos — hardcoded (core de negocio AIP)
//   L2 — Categoría  : data-driven desde window.Skeleton.CONFIG.taxonomyTree
//                     (Superadmin configurable vía SA-01)
//   L3 — Mandato    : lista dinámica de AIP-M-XXXX / AIP-V-XXXX
//                     (v1.3: mock — producción: Firebase)
//
// EVENTOS EMITIDOS (bus document)
//   Skeleton:Action:DomainFocus     { domain }
//   Skeleton:Action:CategoryFocus   { domain, category }
//   Skeleton:Action:MandateSelected { mandateId, domain, category, aimonContext }
//
// CONTRATO AIMON (dos capas — notas_04.3)
//   aimonContext.layer_1_domain   = domainId activo
//   aimonContext.layer_2_document = mandateId activo (null = modo dominio)
//
// INTEGRACIÓN
//   1. Importar este módulo en main.js (auto-wire en Skeleton:Legal:Accepted)
//   2. mount() inyecta <aip-orbit1-tree> en #crm-table-body
//   Línea de integración en main.js:
//     import './gadgets/aip-orbit1-tree.js';
//
// CONTRATOS EXTERNOS (no tocar desde este archivo)
//   · AIPHandler.populateCRMTable() → poblaba #crm-table-body (FROZEN)
//     Esta componente reemplaza su contenido vía mount() después de Legal:Accepted
//   · aip-trinity-layout.js → provee #crm-table-body como contenedor
//   · crm-tokens-v13.css → provee todas las CSS variables --crm-*
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Taxonomía por defecto (L1 fija + L2 configurable por Superadmin).
 * Se usa cuando window.Skeleton.CONFIG.taxonomyTree no está definido.
 * L1: 3 dominios raíz — cambian solo por decisión del Director (R-ARCH-100).
 * L2: 9 categorías — configurables por Superadmin vía SA-01.
 */
const DEFAULT_TAXONOMY = Object.freeze([
    {
        id: 'ma-real-estate',
        label: 'M&A & Real Estate',
        icon: 'business_center',
        categories: Object.freeze([
            { id: 'compraventa-empresarial',  label: 'Compraventa Empresarial' },
            { id: 'real-estate-comercial',    label: 'Real Estate Comercial' },
            { id: 'real-estate-premium',      label: 'Real Estate Premium / Residencial' },
        ]),
    },
    {
        id: 'commodities-trade',
        label: 'Commodities & Trade Finance',
        icon: 'trending_up',
        categories: Object.freeze([
            { id: 'energia-derivados', label: 'Energía & Derivados' },
            { id: 'agricola-soft',     label: 'Agrícola & Soft' },
            { id: 'metales-mineria',   label: 'Metales & Minería' },
        ]),
    },
    {
        id: 'soluciones-financieras',
        label: 'Soluciones Financieras',
        icon: 'account_balance',
        categories: Object.freeze([
            { id: 'deuda-estructurados',  label: 'Deuda & Estructurados' },
            { id: 'equity-capital',       label: 'Equity & Capital' },
            { id: 'hibridos-alternativos', label: 'Híbridos & Alternativos' },
        ]),
    },
    // [TL-15] AIP Ventures — 4º dominio · Roadmap Bloque 3 · 2026-05-31
    // DEUDA_PENDIENTE | ARQ-FIND-04 | categorías pendientes de SDD spec formal
    {
        id: 'aip-ventures',
        label: 'AIP Ventures',
        icon: 'rocket_launch',
        categories: Object.freeze([
            { id: 'venture-equity',        label: 'Venture Equity' },
            { id: 'growth-capital',        label: 'Growth Capital' },
            { id: 'estructurados-venture', label: 'Estructurados Venture' },
        ]),
    },
]);

/**
 * Mandatos mock para prototipo v1.3.
 * Producción: sustituir por lectura de PassportEngine state / Firebase.
 * R27: Object.freeze — datos inmutables en este scope.
 */
const MOCK_MANDATES = Object.freeze([
    { id: 'AIP-M-2026-001', categoryId: 'compraventa-empresarial', score: 82, status: 'ACTIVE',  label: 'Adquisición Tech SaaS · NL' },
    { id: 'AIP-M-2026-002', categoryId: 'real-estate-comercial',   score: 71, status: 'ACTIVE',  label: 'RE Comercial · Amsterdam' },
    { id: 'AIP-M-2026-003', categoryId: 'energia-derivados',       score: 65, status: 'PENDING', label: 'Derivados Energía · TTF' },
    { id: 'AIP-V-2026-001', categoryId: 'venture-equity',           score: 78, status: 'ACTIVE',  label: 'Venture Equity · FinTech' },
    { id: 'AIP-V-2026-002', categoryId: 'growth-capital',           score: 62, status: 'PENDING', label: 'Growth Capital · CleanTech SaaS' },
]);

// ─── CSS DEL COMPONENTE ───────────────────────────────────────────────────────
// R3 (Zero-Hex): solo CSS variables de crm-tokens-v13.css.
// Las variantes de opacidad se definen como tokens locales --orbit1-*.
// ─────────────────────────────────────────────────────────────────────────────
const ORBIT1_STYLES = `
<style id="orbit1-tree-styles">
    /* ── Tokens locales de opacidad (R3 compliant) ─────────────────────── */
    aip-orbit1-tree {
        --orbit1-accent-bg:      color-mix(in srgb, var(--crm-accent) 8%, transparent);
        --orbit1-accent-bg-mid:  color-mix(in srgb, var(--crm-accent) 4%, transparent);
        --orbit1-accent-border:  color-mix(in srgb, var(--crm-accent) 20%, transparent);
        --orbit1-surface-hover:  color-mix(in srgb, var(--crm-text-primary) 3%, transparent);
        --orbit1-surface-hover2: color-mix(in srgb, var(--crm-text-primary) 2%, transparent);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }

    /* ── Dominio (L1) ───────────────────────────────────────────────────── */
    .orbit1-domain {
        border-bottom: 1px solid var(--crm-border);
    }

    .orbit1-domain__header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--crm-text-primary);
        transition: background 0.15s ease, color 0.15s ease;
        font-family: 'JetBrains Mono', monospace;
    }
    .orbit1-domain__header:hover {
        background: var(--orbit1-surface-hover);
    }
    .orbit1-domain__header[aria-expanded="true"] {
        color: var(--crm-accent);
    }

    .orbit1-domain__label {
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        font-weight: 600;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .orbit1-domain__icon {
        font-size: 13px !important;
        color: var(--crm-text-secondary);
        flex-shrink: 0;
    }

    /* ── Categoría (L2) ─────────────────────────────────────────────────── */
    .orbit1-category__header {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px 5px 24px;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--crm-text-secondary);
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        transition: background 0.15s ease, color 0.15s ease;
    }
    .orbit1-category__header:hover {
        background: var(--orbit1-surface-hover2);
        color: var(--crm-text-primary);
    }
    .orbit1-category__header[aria-expanded="true"] {
        color: var(--crm-accent);
    }

    .orbit1-category__label {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ── Chevron animado ────────────────────────────────────────────────── */
    .orbit1-chevron {
        color: var(--crm-text-secondary);
        flex-shrink: 0;
        transition: transform 0.2s ease;
    }
    [aria-expanded="true"] > .orbit1-chevron {
        transform: rotate(90deg);
    }

    /* ── Badge contador ─────────────────────────────────────────────────── */
    .orbit1-badge {
        font-size: 8px;
        font-family: 'JetBrains Mono', monospace;
        background: var(--orbit1-accent-bg);
        color: var(--crm-accent);
        border: 1px solid var(--orbit1-accent-border);
        padding: 1px 5px;
        flex-shrink: 0;
        letter-spacing: 0.05em;
    }

    /* ── Mandato (L3) ───────────────────────────────────────────────────── */
    .orbit1-mandate {
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        padding: 5px 10px 5px 36px;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--crm-border-subtle);
        cursor: pointer;
        text-align: left;
        transition: background 0.12s ease;
    }
    .orbit1-mandate:hover {
        background: var(--orbit1-accent-bg-mid);
    }
    .orbit1-mandate--active {
        background: var(--orbit1-accent-bg);
        border-left: 2px solid var(--crm-accent);
        padding-left: 34px;
    }

    .orbit1-mandate__id {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        color: var(--crm-accent);
        letter-spacing: 0.08em;
        opacity: 0.75;
    }
    .orbit1-mandate__label {
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        color: var(--crm-text-primary);
        line-height: 1.3;
    }

    /* ── IntegrityScore badge ───────────────────────────────────────────── */
    .orbit1-score {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        align-self: flex-start;
        letter-spacing: 0.05em;
    }
    .orbit1-score--high { color: var(--crm-success); }
    .orbit1-score--mid  { color: var(--crm-accent); }
    .orbit1-score--low  { color: var(--crm-text-secondary); }

    /* ── Estado vacío ───────────────────────────────────────────────────── */
    .orbit1-empty {
        padding: 5px 10px 5px 36px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: var(--crm-text-secondary);
        opacity: 0.4;
        font-style: italic;
    }
</style>
`;

// ─── WEB COMPONENT ───────────────────────────────────────────────────────────
class AipOrbit1Tree extends HTMLElement {

    /** Estado interno del árbol (privado) */
    #activeMandateId = null;
    #activeDomainId  = null;
    #activeCategoryId = null;

    // ── Lifecycle ─────────────────────────────────────────────────────────
    connectedCallback() {
        this._render();
        this._wire();
        console.log('[OrbitTree] Árbol de mandatos montado. Taxonomía:', this._getTaxonomy().length, 'dominios.');
    }

    // ── Datos ─────────────────────────────────────────────────────────────

    /**
     * Lee la taxonomía L1+L2.
     * Fuente canónica: window.Skeleton.CONFIG.taxonomyTree (data-driven, SA-01).
     * Fallback: DEFAULT_TAXONOMY hardcoded (3 dominios × 3 categorías).
     */
    _getTaxonomy() {
        return window.Skeleton?.CONFIG?.taxonomyTree ?? DEFAULT_TAXONOMY;
    }

    /**
     * Lista de mandatos activos (L3).
     * v1.3: mock. Producción: PassportEngine state / Firebase.
     */
    _getMandates() {
        return MOCK_MANDATES;
    }

    /** Determina la clase CSS de IntegrityScore según valor */
    _scoreClass(score) {
        if (score >= 80) return 'orbit1-score--high';
        if (score >= 65) return 'orbit1-score--mid';
        return 'orbit1-score--low';
    }

    // ── Render ────────────────────────────────────────────────────────────

    _render() {
        const taxonomy = this._getTaxonomy();
        const mandates = this._getMandates();

        const domainsHtml = taxonomy.map(domain => {
            const domainMandates = mandates.filter(m =>
                domain.categories.some(c => c.id === m.categoryId)
            );

            const categoriesHtml = domain.categories.map(cat => {
                const catMandates = mandates.filter(m => m.categoryId === cat.id);

                const mandatesHtml = catMandates.length > 0
                    ? catMandates.map(m => `
                        <button type="button"
                            class="orbit1-mandate"
                            data-mandate-id="${m.id}"
                            data-category-id="${m.categoryId}"
                            data-domain-id="${domain.id}"
                            data-action-orbit1="SelectMandate"
                            title="${m.id} — IntegrityScore ${m.score}">
                            <span class="orbit1-mandate__id">${m.id}</span>
                            <span class="orbit1-mandate__label">${m.label}</span>
                            <span class="orbit1-score ${this._scoreClass(m.score)}" aria-label="IntegrityScore ${m.score}">IS:${m.score}</span>
                        </button>`
                    ).join('')
                    : '<p class="orbit1-empty">Sin mandatos activos</p>';

                const hasMandates = catMandates.length > 0;
                return `
                    <div class="orbit1-category" data-category-id="${cat.id}" data-domain-id="${domain.id}">
                        <button type="button"
                            class="orbit1-category__header"
                            data-action-orbit1="ToggleCategory"
                            data-category-id="${cat.id}"
                            data-domain-id="${domain.id}"
                            aria-expanded="false">
                            <span class="material-symbols-outlined orbit1-chevron" style="font-size:11px">chevron_right</span>
                            <span class="orbit1-category__label">${cat.label}</span>
                            ${hasMandates ? `<span class="orbit1-badge" aria-label="${catMandates.length} mandatos">${catMandates.length}</span>` : ''}
                        </button>
                        <div class="orbit1-category__body hidden" aria-hidden="true">
                            ${mandatesHtml}
                        </div>
                    </div>`;
            }).join('');

            const hasDomainMandates = domainMandates.length > 0;
            return `
                <div class="orbit1-domain" data-domain-id="${domain.id}">
                    <button type="button"
                        class="orbit1-domain__header"
                        data-action-orbit1="ToggleDomain"
                        data-domain-id="${domain.id}"
                        aria-expanded="false">
                        <span class="material-symbols-outlined orbit1-chevron" style="font-size:12px">chevron_right</span>
                        <span class="material-symbols-outlined orbit1-domain__icon">${domain.icon}</span>
                        <span class="orbit1-domain__label">${domain.label}</span>
                        ${hasDomainMandates ? `<span class="orbit1-badge" aria-label="${domainMandates.length} mandatos activos">${domainMandates.length}</span>` : ''}
                    </button>
                    <div class="orbit1-domain__body hidden" aria-hidden="true">
                        ${categoriesHtml}
                    </div>
                </div>`;
        }).join('');

        // DT-AIP-05: innerHTML con template 100% estático — cero datos externos
        // Los únicos datos dinámicos son la taxonomía y mandatos controlados internamente
        this.innerHTML = `${ORBIT1_STYLES}<div class="orbit1-tree" role="tree">${domainsHtml}</div>`;
    }

    // ── Event Wiring ──────────────────────────────────────────────────────

    /** Event delegation: un solo listener en la raíz del componente */
    _wire() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action-orbit1]');
            if (!btn) return;

            const action = btn.dataset.actionOrbit1;
            if (action === 'ToggleDomain')   this._onToggleDomain(btn);
            if (action === 'ToggleCategory') this._onToggleCategory(btn);
            if (action === 'SelectMandate')  this._onSelectMandate(btn);
        });
    }

    // ── Handlers ──────────────────────────────────────────────────────────

    _onToggleDomain(btn) {
        const domainId   = btn.dataset.domainId;
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const body       = btn.nextElementSibling;
        if (!body) return;

        btn.setAttribute('aria-expanded', String(!isExpanded));
        body.setAttribute('aria-hidden', String(isExpanded));
        body.classList.toggle('hidden', isExpanded);

        if (!isExpanded) {
            // Dominio abierto → emitir contexto AIMON layer_1_domain
            this.#activeDomainId = domainId;
            this._emit('Skeleton:Action:DomainFocus', { domain: domainId });
        }
    }

    _onToggleCategory(btn) {
        const categoryId = btn.dataset.categoryId;
        const domainId   = btn.dataset.domainId;
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const body       = btn.nextElementSibling;
        if (!body) return;

        btn.setAttribute('aria-expanded', String(!isExpanded));
        body.setAttribute('aria-hidden', String(isExpanded));
        body.classList.toggle('hidden', isExpanded);

        if (!isExpanded) {
            this.#activeCategoryId = categoryId;
            this._emit('Skeleton:Action:CategoryFocus', { domain: domainId, category: categoryId });
        }
    }

    _onSelectMandate(btn) {
        // Quitar estado activo del mandato anterior
        this.querySelectorAll('.orbit1-mandate--active')
            .forEach(el => el.classList.remove('orbit1-mandate--active'));

        btn.classList.add('orbit1-mandate--active');

        const mandateId  = btn.dataset.mandateId;
        const categoryId = btn.dataset.categoryId;
        const domainId   = btn.dataset.domainId;

        this.#activeMandateId  = mandateId;
        this.#activeCategoryId = categoryId;
        this.#activeDomainId   = domainId;

        // Contrato AIMON (dos capas — notas_04.3)
        this._emit('Skeleton:Action:MandateSelected', {
            mandateId,
            domain:   domainId,
            category: categoryId,
            aimonContext: Object.freeze({
                layer_1_domain:   domainId,
                layer_2_document: mandateId,
            }),
        });
    }

    // ── Utilidades ────────────────────────────────────────────────────────

    /**
     * Emite un CustomEvent en el bus canónico del documento.
     * R20 (Event-Driven) | R28 (Desacoplamiento)
     */
    _emit(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, {
            detail: Object.freeze(detail),
            bubbles: true,
        }));
        console.log(`[OrbitTree] → ${eventName}`, detail);
    }

    // ── API Pública ───────────────────────────────────────────────────────

    /** Acceso al contexto activo del árbol (para consumidores externos) */
    get activeContext() {
        return Object.freeze({
            layer_1_domain:   this.#activeDomainId,
            layer_2_document: this.#activeMandateId,
            category:         this.#activeCategoryId,
        });
    }

    /**
     * Monta el Web Component en el contenedor indicado.
     * Crea el elemento, reemplaza el contenido del contenedor y retorna la instancia.
     *
     * Uso canónico (en main.js, tras Skeleton:Legal:Accepted):
     *   AipOrbit1Tree.mount('#crm-table-body');
     *
     * @param {string|HTMLElement} container — selector CSS o nodo DOM
     * @returns {AipOrbit1Tree|null}
     */
    static mount(container) {
        const el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!el) {
            console.warn('[OrbitTree] mount(): contenedor no encontrado →', container);
            return null;
        }

        const tree = document.createElement('aip-orbit1-tree');
        el.replaceChildren(tree);
        console.log('[OrbitTree] Montado en', typeof container === 'string' ? container : el.id || el.tagName);
        return tree;
    }
}

// ─── REGISTRO DEL ELEMENTO ───────────────────────────────────────────────────
customElements.define('aip-orbit1-tree', AipOrbit1Tree);

// ─── AUTO-WIRE (patrón Skeleton) ─────────────────────────────────────────────
// Al importar este módulo, el árbol se monta automáticamente cuando el usuario
// supera la atestación legal. Mismo patrón que TabLoader y Router.
document.addEventListener('Skeleton:Legal:Accepted', () => {
    AipOrbit1Tree.mount('#crm-table-body');
}, { once: true });

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export { AipOrbit1Tree };
export default AipOrbit1Tree;
