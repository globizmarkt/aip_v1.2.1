// ============================================================================
// aip-trinity-layout.js
// CRM Trinity Layout — Web Component Shell (cascarón estructural)
// ============================================================================
// ÉPICA    : E4 — CRM Dashboard Init
// TICKET   : E4-CRM-WC-01 — Extracción Trinity Layout a Web Component
// AGENTE   : Claude Code (Sentinel)
// DOCTRINA : R2 (Light DOM — attachShadow PROHIBIDO) · R-GADGET-01
//            (bisturí funcional únicamente — marcado visual inmutable)
//            DT-AIP-05 (this.innerHTML estático — cero datos externos — 0 XSS)
// SESIÓN   : VIBE-AIP-S-REBORN-03.6 · 2026-05-26
// ============================================================================
//
// SDD — Especificación Técnica (Software Design Document)
// ─────────────────────────────────────────────────────────────────────────────
//
// PROPÓSITO
//   Encapsular el chasis visual del CRM Dashboard (Trinity Layout) en un Web
//   Component Light DOM, extrayéndolo del Hueso monolítico (index.html).
//
// PATRÓN DE SUTURA EN index.html (pendiente validación Director)
//   ANTES:
//     <div id="crm-dashboard" class="hidden w-full h-full crm-trinity">
//       <!-- orbits 1, 2, 3 -->
//     </div>
//
//   DESPUÉS:
//     <aip-trinity-layout id="crm-dashboard" class="hidden w-full h-full crm-trinity">
//     </aip-trinity-layout>
//     <script type="module" src="./src/gadgets/aip-trinity-layout.js"></script>
//
// CONTRATOS EXTERNOS (no tocar desde este archivo)
//   · AIPHandler.showCRM()         → manipula classList en #crm-dashboard (el elemento host)
//   · AIPHandler.populateCRMTable()→ popula #crm-table-body
//   · AIPHandler._setupCRMControls()→ enlaza #crm-orbit1-toggle, #crm-orbit3-toggle,
//                                      #crm-theme-toggle-input
//   · AIPHandler._showMandateDetail()→ popula #expediente-detail, #crm-empty-state
//   · SDUI injection               → appendChild a #crm-dashboard (el elemento host)
//   · UIBinder                     → escucha data-action en nodos del Light DOM
//   · i18n engine                  → hidrata data-i18n vía Light DOM scope
//
// ARQUITECTURA LIGHT DOM
//   Al operar sin Shadow DOM, todos los estilos globales (Tailwind CDN + theme-landing.css
//   + theme.css) se heredan directamente. Las clases crm-orbit-1-panel, crm-orbit-main,
//   crm-orbit-3-panel, crm-mandate-list, crm-aimon-* etc. están definidas en theme-landing.css
//   y son accesibles en todo el scope del documento.
//
// LO QUE ESTE ARCHIVO NO HACE (fase cascarón — pendiente Fase 2)
//   · No escucha eventos internos
//   · No popula datos dinámicos
//   · No gestiona el estado del toggle de Órbitas 1/3
//   La electrificación se ejecutará en ticket separado tras validación del Director.
// ─────────────────────────────────────────────────────────────────────────────

class AipTrinityLayout extends HTMLElement {
    connectedCallback() {
        // DT-AIP-05: this.innerHTML con template 100% estático interno — cero datos externos — 0 XSS
        // R-GADGET-01: marcado visual reproducido íntegro — cero alteración estética
        this.innerHTML = `
            <!-- ═══ ÓRBITA 1 — Árbol de Mandatos (MandateTree) ═══ -->
            <aside id="crm-orbit-1" class="crm-orbit-1-panel">
                <!-- Header: label + collapse toggle -->
                <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--crm-border)] shrink-0">
                    <span class="crm-panel-label">MANDATE REGISTRY</span>
                    <button type="button" id="crm-orbit1-toggle"
                            class="crm-collapse-btn flex items-center text-[var(--crm-text-secondary)] hover:text-[var(--crm-accent)] transition-colors border-0 bg-transparent cursor-pointer"
                            aria-label="Colapsar Órbita 1">
                        <span class="material-symbols-outlined crm-chevron" style="font-size:16px;transition:transform 0.35s ease">keyboard_double_arrow_left</span>
                    </button>
                </div>
                <!-- Rail icon: visible solo cuando colapsado -->
                <span class="crm-rail-icon material-symbols-outlined" title="Mandate Registry">folder_open</span>

                <!-- Buscador fiduciario institucional -->
                <div class="px-3 py-3 border-b border-[var(--crm-border)]">
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[var(--crm-text-secondary)] opacity-60" style="font-size:14px">search</span>
                        <input type="text" placeholder="Buscar servicios o IDs..."
                            class="w-full bg-[var(--crm-bg-surface)] border border-[var(--crm-border-subtle)] rounded-sm pl-8 pr-3 py-1.5 text-[11px] font-mono text-[var(--crm-text-primary)] placeholder:text-[var(--crm-text-secondary)] focus:outline-none focus:border-[var(--crm-accent)] transition-colors">
                    </div>
                </div>

                <!-- Cabecera de columna ID -->
                <div class="px-4 py-2 border-b border-[var(--crm-border-subtle)]">
                    <span class="text-[9px] uppercase tracking-[0.25em] text-[var(--crm-text-secondary)] font-mono">CATÁLOGO DE SERVICIOS Y MANDATOS</span>
                </div>

                <!-- Lista de mandatos (poblada por AIPHandler.populateCRMTable) -->
                <div id="crm-table-body" class="crm-mandate-list flex-1 overflow-y-auto"></div>

                <!-- ── Footer: Dark/Light + Configuración de cuenta ── -->
                <div class="border-t border-[var(--crm-border)] shrink-0">
                    <!-- Dark / Light toggle -->
                    <div class="crm-theme-toggle">
                        <span class="material-symbols-outlined text-[var(--crm-text-secondary)]" style="font-size:13px">dark_mode</span>
                        <label class="crm-theme-switch" title="Alternar tema Dark / Light">
                            <input type="checkbox" id="crm-theme-toggle-input">
                            <span class="crm-theme-switch-track"></span>
                        </label>
                        <span class="material-symbols-outlined text-[var(--crm-text-secondary)]" style="font-size:13px">light_mode</span>
                        <span class="crm-theme-label ml-auto">Dark</span>
                    </div>
                    <!-- Acceso a configuración de cuenta -->
                    <button type="button" data-action="OpenUserConfig"
                            class="w-full flex items-center gap-2 px-3 py-2 text-[8px] font-mono uppercase tracking-[0.12em] text-[var(--crm-text-secondary)] hover:text-[var(--crm-accent)] transition-colors border-0 border-t border-[var(--crm-border-subtle)] bg-transparent cursor-pointer">
                        <span class="material-symbols-outlined" style="font-size:13px">manage_accounts</span>
                        <span>Configuración de cuenta</span>
                    </button>
                </div>
            </aside>

            <!-- ═══ ÓRBITA 2 — Banco de Trabajo (MandateWorkbench) ═══ -->
            <main id="crm-orbit-2" class="crm-orbit-main">

                <!-- Breadcrumb + Título -->
                <header class="mb-8 pb-4 border-b border-[var(--crm-border)] shrink-0">
                    <p class="text-[9px] uppercase tracking-[0.3em] text-[var(--crm-text-secondary)] mb-1 font-mono" data-i18n="crm.breadcrumb">—</p>
                    <h1 class="font-serif text-3xl font-light tracking-[0.06em] text-[var(--crm-text-primary)]" data-i18n="crm.title">—</h1>
                </header>

                <!-- Detalle del Mandato activo (oculto hasta selección) -->
                <section id="expediente-detail" class="hidden" aria-labelledby="detail-heading">
                    <div class="mb-6 pb-4 border-b border-[var(--crm-border)] flex items-center justify-between">
                        <h2 id="detail-heading" class="font-serif text-xl font-light tracking-wide text-[var(--crm-text-primary)]" data-i18n="crm.detail.title">—</h2>
                        <span class="font-mono text-xs text-[var(--crm-accent)] tracking-wider">AIP-2026-001</span>
                    </div>
                    <div class="grid grid-cols-3 gap-6 mb-8 pb-6 border-b border-[var(--crm-border)]">
                        <div class="space-y-1">
                            <p class="text-[9px] uppercase tracking-[0.2em] text-[var(--crm-text-secondary)] font-mono" data-i18n="crm.detail.country">—</p>
                            <p class="text-base text-[var(--crm-text-primary)] tracking-wide" id="detail-pais">Países Bajos</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[9px] uppercase tracking-[0.2em] text-[var(--crm-text-secondary)] font-mono" data-i18n="crm.detail.ticket">—</p>
                            <p class="text-base text-[var(--crm-text-primary)] tracking-wide font-mono" id="detail-ticket">€ 250,000</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[9px] uppercase tracking-[0.2em] text-[var(--crm-text-secondary)] font-mono" data-i18n="crm.detail.roi">—</p>
                            <p class="text-base text-[var(--crm-accent)] tracking-wide font-mono" id="detail-roi">+12.4%</p>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-[9px] uppercase tracking-[0.25em] text-[var(--crm-text-secondary)] mb-4" data-i18n="crm.detail.timeline">—</h3>
                        <div class="flex items-start gap-3">
                            <div class="shrink-0 w-7 h-7 rounded-full bg-[var(--crm-success)]/10 border border-[var(--crm-success)]/30 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[var(--crm-success)] text-base">check_circle</span>
                            </div>
                            <div class="flex-1 pt-0.5">
                                <p class="text-sm text-[var(--crm-text-primary)] tracking-wide">KYC Nivel 1 — Identidad Verificada</p>
                                <p class="text-[9px] text-[var(--crm-text-secondary)] uppercase tracking-wider mt-0.5">Completado · 2026-03-15</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3">
                            <div class="shrink-0 w-7 h-7 rounded-full bg-[var(--crm-success)]/10 border border-[var(--crm-success)]/30 flex items-center justify-center">
                                <span class="material-symbols-outlined text-[var(--crm-success)] text-base">lock_open</span>
                            </div>
                            <div class="flex-1 pt-0.5">
                                <p class="text-sm text-[var(--crm-text-primary)] tracking-wide">Acuerdo de Confidencialidad (NCNDA)</p>
                                <p class="text-[9px] text-[var(--crm-text-secondary)] uppercase tracking-wider mt-0.5">Completado · 2026-03-22</p>
                            </div>
                        </div>
                        <div class="flex items-start gap-3 opacity-40">
                            <div class="shrink-0 w-7 h-7 rounded-full bg-[var(--crm-bg-elevated)] border border-[var(--crm-border)] flex items-center justify-center">
                                <span class="material-symbols-outlined text-[var(--crm-text-secondary)] text-base">lock</span>
                            </div>
                            <div class="flex-1 pt-0.5">
                                <p class="text-sm text-[var(--crm-text-secondary)] tracking-wide">Due Diligence Financiera Extendida</p>
                                <p class="text-[9px] text-[var(--crm-text-secondary)] uppercase tracking-wider mt-0.5" data-i18n="crm.detail.blocked_kyc2">—</p>
                            </div>
                            <button type="button" class="shrink-0 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] border border-[var(--crm-border)] text-[var(--crm-text-secondary)] hover:border-[var(--crm-accent)]/30 hover:text-[var(--crm-accent)] transition-all duration-300" data-action="KYC2Request" data-i18n="crm.action.request_kyc2">—</button>
                        </div>
                    </div>
                </section>

                <!-- Estado vacío — sin mandato seleccionado -->
                <div id="crm-empty-state" class="crm-empty-state">
                    <span class="material-symbols-outlined text-4xl mb-4" style="color:var(--crm-text-secondary);opacity:0.25">folder_open</span>
                    <p class="text-[9px] uppercase tracking-[0.3em] font-mono" style="color:var(--crm-text-secondary);opacity:0.4" data-i18n="crm.empty.select">Seleccione un mandato</p>
                </div>
            </main>

            <!-- ═══ ÓRBITA 3 — AIMON Contextual (Mandate-Aware) ═══ -->
            <aside id="crm-orbit-3-panel" class="crm-orbit-3-panel">
                <!-- Header: collapse toggle + label -->
                <div class="flex items-center justify-between px-3 py-2 border-b border-[var(--crm-border)] shrink-0">
                    <button type="button" id="crm-orbit3-toggle"
                            class="crm-collapse-btn flex items-center text-[var(--crm-text-secondary)] hover:text-[var(--crm-accent)] transition-colors border-0 bg-transparent cursor-pointer"
                            aria-label="Colapsar Órbita 3">
                        <span class="material-symbols-outlined crm-chevron" style="font-size:16px;transition:transform 0.35s ease">keyboard_double_arrow_right</span>
                    </button>
                    <span class="crm-panel-label">AIMON // CONTEXTUAL</span>
                </div>
                <!-- Rail icon: visible solo cuando colapsado -->
                <span class="crm-rail-icon material-symbols-outlined" title="AIMON">smart_toy</span>
                <div class="crm-aimon-header">
                    <span class="crm-aimon-status-dot"></span>
                    <span class="text-[9px] font-mono text-[var(--crm-text-secondary)] uppercase tracking-widest">Sistema activo</span>
                </div>
                <div class="crm-aimon-log overflow-y-auto px-4 py-3" style="flex:0 0 auto;">
                    <p class="crm-aimon-entry crm-aimon-entry--system">AIMON v1.2 · Modo Mandato Activo</p>
                    <p class="crm-aimon-entry crm-aimon-entry--reminder">Atestación legal completada. Clearance: BRONZE.</p>
                    <p class="crm-aimon-entry crm-aimon-entry--system">Seleccione un mandato para análisis contextual.</p>
                </div>
                <div class="crm-aimon-cursor px-4 py-2 border-t border-[var(--crm-border)] flex items-center gap-2 shrink-0">
                    <span class="font-mono text-[10px] text-[var(--crm-accent)]">▸</span>
                    <span class="font-mono text-[10px] text-[var(--crm-text-secondary)]">_</span>
                </div>

                <!-- Actividad reciente -->
                <div class="px-4 py-3 border-t border-[var(--crm-border)] flex-1 overflow-y-auto">
                    <p class="text-[9px] uppercase tracking-widest text-[var(--crm-text-secondary)] mb-2 font-mono">Actividad Reciente</p>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <div>
                            <p style="font-size:11px;color:var(--crm-text-primary);">Documento KYC-T2 subido</p>
                            <p style="font-size:9px;color:var(--crm-text-secondary);">PRJ-2026-001 · Identidad oficial</p>
                            <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:2px;">2d</p>
                        </div>
                        <div>
                            <p style="font-size:11px;color:var(--crm-text-primary);">Mandato PRJ-2026-002 creado</p>
                            <p style="font-size:9px;color:var(--crm-text-secondary);">Advisory · 120M USD · CO/SFC</p>
                            <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:2px;">15d</p>
                        </div>
                        <div>
                            <p style="font-size:11px;color:var(--crm-text-primary);">AML check completado</p>
                            <p style="font-size:9px;color:var(--crm-text-secondary);">PRJ-2026-001 · CLEAR</p>
                            <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:2px;">22d</p>
                        </div>
                    </div>
                </div>

                <!-- Próximas acciones -->
                <div class="px-4 py-3 border-t border-[var(--crm-border)] shrink-0">
                    <p class="text-[9px] uppercase tracking-widest text-[var(--crm-text-secondary)] mb-2 font-mono">Próximas Acciones</p>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <button style="width:100%;padding:8px 12px;background:var(--crm-surface);border:1px solid var(--crm-border);color:var(--crm-text-primary);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-align:left;cursor:pointer;">
                            [2] VER WORKBENCH →
                        </button>
                        <button style="width:100%;padding:8px 12px;background:var(--crm-surface);border:1px solid var(--crm-border);color:var(--crm-text-primary);font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.1em;text-align:left;cursor:pointer;">
                            [3] VINCULAR WALLET
                        </button>
                    </div>
                    <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:8px;line-height:1.5;">
                        La vinculación de wallet añade +5 pts al IntegrityScore (componente Verificaciones).
                    </p>
                </div>
            </aside>
        `;

        // [FORJA-VIS-II] Rail Suture — AIPHandler._setupCRMControls() se ejecuta antes
        // de que connectedCallback() corra (timing de módulos), así que el wiring
        // de chevrones falla silenciosamente allí (getElementById devuelve null).
        // Esta sutura garantiza el vínculo correcto.
        this._wireRailToggles();

        // [E6-T07] Infraestructura de enrutamiento reactivo Orbit-2
        // _wireViewBus() vacío en Opción A (Option B: VIBE 1.3+)
        this._wireViewBus();

        // [i18n-WC-01] Re-hidratación post-render — 2026-06-07
        // El motor i18n (UIHydrator) escanea el DOM antes de que connectedCallback()
        // inyecte este innerHTML. Los nodos data-i18n nacen fuera de la ventana del scan.
        // setTimeout(0) aplaza el dispatch hasta el siguiente tick, cuando el DOM ya
        // contiene los nodos nuevos. UIHydrator escucha Skeleton:DictionaryReady
        // y llama hydrateAll() → document.querySelectorAll('[data-i18n]') los captura.
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('Skeleton:DictionaryReady'));
        }, 0);
    }

    // ─── Rail Toggle Handlers ─────────────────────────────────────────────────
    // Bisturí funcional (R-GADGET-01): solo JS, sin alterar el marcado.
    // Patrón: toggle clase .collapsed en el panel → CSS hace el resto.
    _wireRailToggles() {
        const orbit1Panel  = this.querySelector('#crm-orbit-1');
        const orbit1Toggle = this.querySelector('#crm-orbit1-toggle');
        const orbit3Panel  = this.querySelector('#crm-orbit-3-panel');
        const orbit3Toggle = this.querySelector('#crm-orbit3-toggle');

        if (orbit1Toggle && orbit1Panel) {
            orbit1Toggle.addEventListener('click', () => {
                const isCollapsed = orbit1Panel.classList.toggle('collapsed');
                orbit1Toggle.setAttribute('aria-expanded', String(!isCollapsed));
                const icon = orbit1Toggle.querySelector('.crm-chevron');
                if (icon) icon.textContent = isCollapsed
                    ? 'keyboard_double_arrow_right'
                    : 'keyboard_double_arrow_left';
            });
        }

        if (orbit3Toggle && orbit3Panel) {
            orbit3Toggle.addEventListener('click', () => {
                const isCollapsed = orbit3Panel.classList.toggle('collapsed');
                orbit3Toggle.setAttribute('aria-expanded', String(!isCollapsed));
                const icon = orbit3Toggle.querySelector('.crm-chevron');
                if (icon) icon.textContent = isCollapsed
                    ? 'keyboard_double_arrow_left'
                    : 'keyboard_double_arrow_right';
            });
        }
    }
    // ─── Controlador de Vistas — Infraestructura Orbit-2 [E6-T07] ───────────────
    // Opción A activa: aip-crm-home maneja DomainFocus/CategorySelected/MandateSelected.
    // injectView() disponible como API para Option B (VIBE 1.3+).
    // _wireViewBus() sin listeners hasta activación de Option B.

    /**
     * Inyecta un Web Component dinámicamente en el contenedor central de Órbita 2.
     * @param {string} componentTagName - Nombre del custom element (ej. 'aip-domain-overview')
     * @param {Object} payload - Objeto de contexto pasado como viewContext al componente
     */
    injectView(componentTagName, payload = {}) {
        const container = this.querySelector('#crm-orbit-2');
        if (!container) {
            console.warn('[TrinityLayout] Contenedor #crm-orbit-2 no encontrado.');
            return;
        }
        container.innerHTML = '';
        const viewEl = document.createElement(componentTagName);
        viewEl.viewContext = payload;
        if (payload.id) viewEl.dataset.id = payload.id;
        container.appendChild(viewEl);
        console.log(`[TrinityLayout] Vista inyectada: <${componentTagName}>`, payload);
    }

    /**
     * Bus de enrutamiento reactivo.
     * OPCIÓN A: vacío — el enrutamiento lo hace aip-crm-home internamente.
     * OPCIÓN B (VIBE 1.3+): activar listeners DomainFocus / CategorySelected / MandateSelected.
     */
    _wireViewBus() {
        // [PLACEHOLDER Option B — VIBE 1.3+]
        // document.addEventListener('Skeleton:Action:DomainFocus', (e) => {
        //     this.injectView('aip-domain-overview', e.detail || {});
        // });
    }
}

customElements.define('aip-trinity-layout', AipTrinityLayout);
export default AipTrinityLayout;
