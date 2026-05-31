// ============================================================================
// aip-orbit1-tree.js
// CRM Órbita 1 — Árbol de Mandatos (Domain → Category → Mandate)
// ============================================================================
// ÉPICA    : E5 — CRM Shell · Órbita 1 Navigation Tree
// TICKET   : E5-GADGET-7.4 (Ruta A — Forja directa)
//            CRM-TREE-02 — CategorySelected + señalización dual-layer (2026-05-31)
// AGENTE   : Claude Code (Sentinel)
// DOCTRINA : R2 (Light DOM — attachShadow PROHIBIDO)
//            R3 (Zero-Hex — solo CSS variables en estilos)
//            R20 (Event-Driven — bus canónico CustomEvents)
//            R25 (Sensores ciegos — sin lógica de negocio)
//            R27 (Object.freeze — inmutabilidad de contrato)
//            R28 (Desacoplamiento — eventos, no llamadas directas)
//            DT-AIP-05 (XSS Zero-Trust — textContent, nunca innerHTML externo)
// SESIÓN   : VIBE-AIP-S-REBORN-03.4 · 2026-05-30 / 2026-05-31
// ============================================================================
//
// PROPÓSITO
//   Árbol de navegación de 3 niveles para el panel Órbita 1 del CRM Dashboard.
//   Renderiza la taxonomía fiduciaria de AIP (Dominios → Categorías → Mandatos)
//   y emite eventos en el bus canónico cuando el usuario navega.
//
// NIVELES DEL ÁRBOL
//   L1 — Dominio    : 4 nodos fijos (Director solo puede modificar)
//   L2 — Categoría  : dual-layer — PROCEDIMIENTO (libre) + OPORTUNIDADES (gateadas)
//                     data-driven desde window.Skeleton.CONFIG.taxonomyTree
//   L3 — Mandato    : lista dinámica AIP-M-XXXX / AIP-V-XXXX
//                     (v1.3: mock — producción: Firebase)
//
// EVENTOS EMITIDOS (bus document)
//   Skeleton:Action:DomainFocus       { domain }
//   Skeleton:Action:CategoryFocus     { domain, category }        ← solo toggle expand
//   Skeleton:Action:CategorySelected  { categoryId, layer, domain, categoryData, aimonContext }
//   Skeleton:Action:MandateSelected   { mandateId, domain, category, aimonContext }
//
// UX DEL NODO L2
//   [>] [LABEL CATEGORÍA]  [PROC]  [N opp 🔒]
//    ↑         ↑              ↑         ↑
//   toggle   navega a      navega    navega a
//  expand   procedure     procedure  opportunity
//
// CONTRATO AIMON (dos capas)
//   aimonContext.layer_1_domain   = domainId activo
//   aimonContext.layer_2_document = mandateId activo (null = modo categoría)
//   aimonContext.category         = categoryId activo
//   aimonContext.contentLayer     = 'procedure' | 'opportunity'
//
// INTEGRACIÓN
//   main.js: import './gadgets/aip-orbit1-tree.js';
//   mount() inyecta <aip-orbit1-tree> en #crm-table-body
//   Auto-wire en Skeleton:Legal:Accepted
//
// CONTRATO DE DATOS
//   mockState.categories  → keyed by categoryId (SSoT)
//   mockState.documents   → keyed by documentId
//
// ─────────────────────────────────────────────────────────────────────────────

import { mockState } from '../verticals/aip/mockState.js';

/**
 * Taxonomía por defecto (L1 fija + L2 configurable por Superadmin).
 * Keys de categorías alineados con mockState.categories.
 * L1: 4 dominios raíz — cambian solo por decisión del Director.
 * L2: 9+ categorías — configurables por Superadmin vía SA-01.
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
            { id: 'deuda-estructurados',   label: 'Deuda & Estructurados' },
            { id: 'equity-capital',        label: 'Equity & Capital' },
            { id: 'hibridos-alternativos', label: 'Híbridos & Alternativos' },
        ]),
    },
    // [TL-15] AIP Ventures — 4º dominio · 2026-05-31
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
 * Producción: PassportEngine state / Firebase.
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
// CRM-TREE-02: añadidos estilos para dual-layer L2 (row + badges).
//   Clases EXISTENTES: sin modificar (R-GADGET-01).
//   Clases NUEVAS: orbit1-category__row, __toggle, __nav, __badges,
//                  orbit1-badge-proc, orbit1-badge-opp, modificadores.
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
        --orbit1-proc-bg:        color-mix(in srgb, var(--crm-success) 10%, transparent);
        --orbit1-proc-border:    color-mix(in srgb, var(--crm-success) 25%, transparent);
        --orbit1-opp-bg:         color-mix(in srgb, var(--crm-gold) 8%, transparent);
        --orbit1-opp-border:     color-mix(in srgb, var(--crm-gold) 25%, transparent);
        --orbit1-opp-locked-bg:  color-mix(in srgb, var(--crm-text-secondary) 6%, transparent);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
    }

    /* ── Dominio (L1) — EXISTENTE, sin modificar ────────────────────────── */
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

    /* ── Categoría (L2) — EXISTENTE, sin modificar ──────────────────────── */
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

    /* ── CRM-TREE-02: Fila L2 con separación de responsabilidades ──────── */
    /* Reemplaza el <button> monolítico por una fila con 3 zonas */
    .orbit1-category__row {
        display: flex;
        align-items: center;
        width: 100%;
    }

    /* Zona 1: Toggle (solo chevron) */
    .orbit1-category__toggle {
        flex-shrink: 0;
        width: 24px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--crm-text-secondary);
        padding: 0;
        transition: color 0.15s ease;
    }
    .orbit1-category__toggle:hover {
        color: var(--crm-text-primary);
        background: var(--orbit1-surface-hover2);
    }
    .orbit1-category__toggle[aria-expanded="true"] {
        color: var(--crm-accent);
    }

    /* Zona 2: Navegación (label → procedure view) */
    .orbit1-category__nav {
        flex: 1;
        min-width: 0;
        height: 28px;
        display: flex;
        align-items: center;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--crm-text-secondary);
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 0 4px;
        transition: background 0.15s ease, color 0.15s ease;
    }
    .orbit1-category__nav:hover {
        background: var(--orbit1-surface-hover2);
        color: var(--crm-text-primary);
    }
    .orbit1-category__nav--active {
        color: var(--crm-accent);
    }

    /* Zona 3: Badges dual-layer */
    .orbit1-category__badges {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 3px;
        padding-right: 6px;
    }

    /* Badge PROCEDIMIENTO — siempre accesible */
    .orbit1-badge-proc {
        display: inline-flex;
        align-items: center;
        padding: 1px 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 7px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        cursor: pointer;
        background: var(--orbit1-proc-bg);
        color: var(--crm-success);
        border: 1px solid var(--orbit1-proc-border);
        transition: background 0.12s ease;
        user-select: none;
    }
    .orbit1-badge-proc:hover {
        background: color-mix(in srgb, var(--crm-success) 18%, transparent);
    }

    /* Badge OPORTUNIDADES — gateado o disponible */
    .orbit1-badge-opp {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 1px 4px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 7px;
        letter-spacing: 0.06em;
        cursor: pointer;
        border: 1px solid;
        transition: background 0.12s ease;
        user-select: none;
    }
    .orbit1-badge-opp--locked {
        background: var(--orbit1-opp-locked-bg);
        color: var(--crm-text-secondary);
        border-color: color-mix(in srgb, var(--crm-text-secondary) 20%, transparent);
    }
    .orbit1-badge-opp--locked:hover {
        background: color-mix(in srgb, var(--crm-text-secondary) 10%, transparent);
    }
    .orbit1-badge-opp--available {
        background: var(--orbit1-opp-bg);
        color: var(--crm-gold);
        border-color: var(--orbit1-opp-border);
    }
    .orbit1-badge-opp--available:hover {
        background: color-mix(in srgb, var(--crm-gold) 16%, transparent);
    }

    /* ── Chevron animado — EXISTENTE ────────────────────────────────────── */
    .orbit1-chevron {
        color: var(--crm-text-secondary);
        flex-shrink: 0;
        transition: transform 0.2s ease;
    }
    [aria-expanded="true"] > .orbit1-chevron {
        transform: rotate(90deg);
    }

    /* ── Badge contador — EXISTENTE ─────────────────────────────────────── */
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

    /* ── Mandato (L3) — EXISTENTE ───────────────────────────────────────── */
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

    /* ── IntegrityScore badge — EXISTENTE ───────────────────────────────── */
    .orbit1-score {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        align-self: flex-start;
        letter-spacing: 0.05em;
    }
    .orbit1-score--high { color: var(--crm-success); }
    .orbit1-score--mid  { color: var(--crm-accent); }
    .orbit1-score--low  { color: var(--crm-text-secondary); }

    /* ── Estado vacío — EXISTENTE ───────────────────────────────────────── */
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
    #activeMandateId  = null;
    #activeDomainId   = null;
    #activeCategoryId = null;
    #activeLayer      = 'procedure'; // [CRM-TREE-02] capa activa en L2

    // ── Lifecycle ─────────────────────────────────────────────────────────
    connectedCallback() {
        this._render();
        this._wire();
        console.log('[OrbitTree] Árbol montado. Taxonomía:', this._getTaxonomy().length, 'dominios.');
    }

    // ── Datos ─────────────────────────────────────────────────────────────

    _getTaxonomy() {
        return window.Skeleton?.CONFIG?.taxonomyTree ?? DEFAULT_TAXONOMY;
    }

    _getMandates() {
        return MOCK_MANDATES;
    }

    /**
     * [CRM-TREE-02] Datos del nodo L2 desde mockState.categories.
     * Producción: Firebase → mockState hidratado.
     * @param {string} categoryId
     * @returns {Object|null}
     */
    _getCategoryData(categoryId) {
        return mockState?.categories?.[categoryId] ?? null;
    }

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
                const catData     = this._getCategoryData(cat.id);

                // ── Oportunidades badge ──────────────────────────────────
                const oppThreshold = catData?.opportunities?.unlock_threshold?.integrityScore ?? 75;
                const oppCount     = catData?.opportunities?.mandate_ids?.length ?? 0;
                const hasCatData   = !!catData;

                const oppBadgeClass  = oppCount > 0
                    ? 'orbit1-badge-opp orbit1-badge-opp--available'
                    : 'orbit1-badge-opp orbit1-badge-opp--locked';
                const oppBadgeLabel  = oppCount > 0 ? `${oppCount}` : '—';
                const oppBadgeTitle  = hasCatData
                    ? `Oportunidades · IntegrityScore ${oppThreshold} requerido`
                    : 'Oportunidades — próximamente';

                // ── Mandatos L3 ──────────────────────────────────────────
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

                // ── HTML del nodo L2 [CRM-TREE-02] ──────────────────────
                // Tres zonas separadas: toggle | nav (→procedure) | badges
                return `
                    <div class="orbit1-category"
                        data-category-id="${cat.id}"
                        data-domain-id="${domain.id}">

                        <div class="orbit1-category__row">

                            <!-- Zona 1: toggle expand/collapse -->
                            <button type="button"
                                class="orbit1-category__toggle"
                                data-action-orbit1="ToggleCategory"
                                data-category-id="${cat.id}"
                                data-domain-id="${domain.id}"
                                aria-expanded="false"
                                title="Expandir / colapsar">
                                <span class="material-symbols-outlined orbit1-chevron" style="font-size:11px">chevron_right</span>
                            </button>

                            <!-- Zona 2: navega a procedure view -->
                            <button type="button"
                                class="orbit1-category__nav"
                                data-action-orbit1="SelectCategory"
                                data-category-id="${cat.id}"
                                data-domain-id="${domain.id}"
                                data-layer="procedure"
                                title="${cat.label} — procedimiento operativo">
                                <span class="orbit1-category__label">${cat.label}</span>
                            </button>

                            <!-- Zona 3: badges dual-layer -->
                            <div class="orbit1-category__badges">
                                <span class="orbit1-badge-proc"
                                    role="button" tabindex="0"
                                    data-action-orbit1="SelectCategory"
                                    data-category-id="${cat.id}"
                                    data-domain-id="${domain.id}"
                                    data-layer="procedure"
                                    title="Procedimiento — acceso libre">PROC</span>
                                <span class="${oppBadgeClass}"
                                    role="button" tabindex="0"
                                    data-action-orbit1="SelectCategory"
                                    data-category-id="${cat.id}"
                                    data-domain-id="${domain.id}"
                                    data-layer="opportunity"
                                    title="${oppBadgeTitle}">${oppBadgeLabel} 🔒</span>
                            </div>

                        </div>

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

        // DT-AIP-05: template con datos controlados internamente
        this.innerHTML = `${ORBIT1_STYLES}<div class="orbit1-tree" role="tree">${domainsHtml}</div>`;
    }

    // ── Event Wiring ──────────────────────────────────────────────────────

    _wire() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action-orbit1]');
            if (!btn) return;

            const action = btn.dataset.actionOrbit1;
            if (action === 'ToggleDomain')    this._onToggleDomain(btn);
            if (action === 'ToggleCategory')  this._onToggleCategory(btn);
            if (action === 'SelectCategory')  this._onSelectCategory(btn); // [CRM-TREE-02]
            if (action === 'SelectMandate')   this._onSelectMandate(btn);
        });

        // Accesibilidad: Enter/Space en spans con role="button"
        this.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const btn = e.target.closest('[data-action-orbit1]');
            if (!btn) return;
            e.preventDefault();
            btn.click();
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
            this.#activeDomainId = domainId;
            this._emit('Skeleton:Action:DomainFocus', { domain: domainId });
        }
    }

    /** Toggle expand/collapse — NO navega orbit-2. Solo abre/cierra L3. */
    _onToggleCategory(btn) {
        const categoryId = btn.dataset.categoryId;
        const domainId   = btn.dataset.domainId;
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        // [CRM-TREE-02] body es hermano del row, no del button — usar querySelector
        const categoryEl = btn.closest('.orbit1-category');
        const body       = categoryEl?.querySelector('.orbit1-category__body');
        if (!body) return;

        btn.setAttribute('aria-expanded', String(!isExpanded));
        body.setAttribute('aria-hidden', String(isExpanded));
        body.classList.toggle('hidden', isExpanded);

        if (!isExpanded) {
            this.#activeCategoryId = categoryId;
            this.#activeDomainId   = domainId;
            // CategoryFocus: solo notifica foco — NO cambia orbit-2
            this._emit('Skeleton:Action:CategoryFocus', { domain: domainId, category: categoryId });
        }
    }

    /**
     * [CRM-TREE-02] Navegación a una capa del nodo L2.
     * Emite CategorySelected con layer='procedure' | 'opportunity'.
     * También expande el nodo si está colapsado.
     */
    _onSelectCategory(btn) {
        const categoryId = btn.dataset.categoryId;
        const domainId   = btn.dataset.domainId;
        const layer      = btn.dataset.layer ?? 'procedure';

        this.#activeCategoryId = categoryId;
        this.#activeDomainId   = domainId;
        this.#activeLayer      = layer;
        this.#activeMandateId  = null; // salir de cualquier mandate-detail activo

        // Expandir el nodo si está colapsado
        const categoryEl = btn.closest('.orbit1-category');
        if (categoryEl) {
            const toggle = categoryEl.querySelector('.orbit1-category__toggle');
            const body   = categoryEl.querySelector('.orbit1-category__body');
            if (toggle && body && toggle.getAttribute('aria-expanded') !== 'true') {
                toggle.setAttribute('aria-expanded', 'true');
                body.setAttribute('aria-hidden', 'false');
                body.classList.remove('hidden');
            }
        }

        // Marcar nav activo visualmente
        this.querySelectorAll('.orbit1-category__nav--active')
            .forEach(el => el.classList.remove('orbit1-category__nav--active'));
        const navBtn = categoryEl?.querySelector('.orbit1-category__nav');
        if (navBtn) navBtn.classList.add('orbit1-category__nav--active');

        // Datos completos del nodo (para que orbit-2 no tenga que re-lookupear)
        const catData = this._getCategoryData(categoryId);

        this._emit('Skeleton:Action:CategorySelected', {
            categoryId,
            layer,
            domain:       domainId,
            categoryData: catData ?? null,
            aimonContext: Object.freeze({
                layer_1_domain:   domainId,
                layer_2_document: null,
                category:         categoryId,
                contentLayer:     layer,
            }),
        });
    }

    _onSelectMandate(btn) {
        this.querySelectorAll('.orbit1-mandate--active')
            .forEach(el => el.classList.remove('orbit1-mandate--active'));

        btn.classList.add('orbit1-mandate--active');

        const mandateId  = btn.dataset.mandateId;
        const categoryId = btn.dataset.categoryId;
        const domainId   = btn.dataset.domainId;

        this.#activeMandateId  = mandateId;
        this.#activeCategoryId = categoryId;
        this.#activeDomainId   = domainId;

        // Busca el objeto completo del mandato en mockState
        const mandate = mockState?.mandates?.find(m => m.mandateId === mandateId) ?? null;

        this._emit('Skeleton:Action:MandateSelected', {
            mandate,
            mandateId,
            domain:   domainId,
            category: categoryId,
            aimonContext: Object.freeze({
                layer_1_domain:   domainId,
                layer_2_document: mandateId,
                category:         categoryId,
                contentLayer:     'mandate-detail',
            }),
        });
    }

    // ── Utilidades ────────────────────────────────────────────────────────

    _emit(eventName, detail) {
        document.dispatchEvent(new CustomEvent(eventName, {
            detail: Object.freeze(detail),
            bubbles: true,
        }));
        console.log(`[OrbitTree] → ${eventName}`, detail);
    }

    // ── API Pública ───────────────────────────────────────────────────────

    get activeContext() {
        return Object.freeze({
            layer_1_domain:   this.#activeDomainId,
            layer_2_document: this.#activeMandateId,
            category:         this.#activeCategoryId,
            contentLayer:     this.#activeLayer,
        });
    }

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

// ─── REGISTRO ────────────────────────────────────────────────────────────────
customElements.define('aip-orbit1-tree', AipOrbit1Tree);

// ─── AUTO-WIRE ───────────────────────────────────────────────────────────────
document.addEventListener('Skeleton:Legal:Accepted', () => {
    AipOrbit1Tree.mount('#crm-table-body');
}, { once: true });

// ─── EXPORTS ─────────────────────────────────────────────────────────────────
export { AipOrbit1Tree };
export default AipOrbit1Tree;
