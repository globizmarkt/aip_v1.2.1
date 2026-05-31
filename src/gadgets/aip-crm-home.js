// ============================================================
// ARCHIVO  : aip-crm-home.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-31
// PROPÓSITO: Web Component del HOME de Órbita 2 (CRM Dashboard).
//            Vista de Portfolio Overview — estado HOME canónico del CRM.
//            Montado cuando layer_2_document === null (sin mandato abierto).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — mock data v1.3
// [SEC-03] Constantes — CSS (R3 Zero-Hex: solo CSS variables)
// [SEC-04] Clase AipCrmHome — Web Component
//   [SEC-04a] Campos privados + lifecycle
//   [SEC-04b] stateChanged — reactividad al store
//   [SEC-04c] _render — construcción del DOM
//   [SEC-04d] _wire — event delegation
//   [SEC-04e] _emit + dispatch — bus canónico + FSM
//   [SEC-04f] Helpers de render (SVG ring, barras, badge tier)
//   [SEC-04g] static mount — API pública de montaje
// [SEC-05] Registro + auto-wire

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): solo CSS variables de crm-tokens-v13.css
//   R20 (Event-Driven): bus canónico CustomEvents en document
//   R25 (Sensores ciegos): sin lógica de negocio en la vista
//   R27 (Object.freeze): inmutabilidad de contrato
//   DT-AIP-05 (XSS Zero-Trust): textContent, nunca innerHTML con datos externos
//
// BLUEPRINT DE REFERENCIA
//   DOMAIN_BLUEPRINT_04_CRM_SHELL.md — B1-B5 sellados 2026-05-31
//   GADGET_06_CRM.3_codigo_crm-home.html — maqueta aprobada por Director
//
// EVENTOS ESCUCHADOS (bus document)
//   Skeleton:Legal:Accepted → auto-wire mount
//   Skeleton:Action:MandateSelected → recibe aimonContext (emitido por aip-orbit1-tree)
//
// EVENTOS EMITIDOS (bus document)
//   Skeleton:CRM:ProjectSelected    { projectId }
//   Skeleton:CRM:KycInitiated       { tier }
//   Skeleton:CRM:WalletLinkInitiated {}
//
// EVENTOS FSM (UserFSM.send vía dispatch())
//   PROJECT_CREATE_INITIATED
//   KYC_TIER3_INITIATED
//   CRM_WORKBENCH_REQUESTED
//   WALLET_LINK_INITIATED
//
// INTEGRACIÓN
//   main.js: import './gadgets/aip-crm-home.js';
//   Montado en: #crm-orbit-main (contenedor de Órbita 2)
//   Auto-wire en Skeleton:Legal:Accepted — mismo patrón que aip-orbit1-tree.js
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones y dependencias
import { ReactiveElement } from '../03-interface/base/reactive-element.js';

// [SEC-02] Constantes — mock data v1.3
// PRODUCCIÓN: sustituir por lectura de PassportEngine + Firebase

/** Sesión mock — v1.3. Producción: state.session via PassportEngine */
const MOCK_SESSION = Object.freeze({
    operador:        'M. ARRIETA',
    clearanceLevel:  'BRONZE',
    clearanceTier:   1,
    integrityScore:  67,
    integrityThresholds: Object.freeze({ silver: 75, gold: 90 }),
    kycTiers: Object.freeze([
        { tier: 1, label: 'Email + Teléfono',     completed: true  },
        { tier: 2, label: 'Identidad oficial',     completed: true  },
        { tier: 3, label: 'Patrimonio + Origen',   completed: false },
    ]),
    scoreComponents: Object.freeze([
        { id: 'kyc',        label: 'KYC TIER',       score: 25, max: 40, detail: 'Tier 1 ✓ · Tier 2 ✓ · Tier 3 pendiente' },
        { id: 'historial',  label: 'HISTORIAL OP.',  score: 18, max: 25, detail: '12m antigüedad · 1 proyecto previo · sin rechazos AML' },
        { id: 'verif',      label: 'VERIFICACIONES', score: 15, max: 20, detail: 'Email ✓ · Documento ✓ · Wallet pendiente' },
        { id: 'comportam',  label: 'COMPORTAMIENTO', score:  9, max: 15, detail: 'IP consistente · sin patrones de riesgo' },
    ]),
    capacidades: Object.freeze([
        { label: 'Consultas operacionales', activa: true  },
        { label: 'Proyectos MADURACIÓN',    activa: true  },
        { label: 'Matching engine',         activa: false },
        { label: 'Ejecución de deals',      activa: false },
    ]),
    sessionTimestamp: '2026-05-31T14:22:09Z',
    sessionActive:    true,
    sessionDuration:  '00:17:43',
    traceId:          'A6-7F2C-4B1D',
});

/** Proyectos mock — v1.3. Producción: state.crm.projects via Firebase */
const MOCK_PROJECTS = Object.freeze([
    Object.freeze({
        id:         'PRJ-2026-001',
        firstTouch: '2026-04-03',
        label:      'Estructuración STAK — Energía Fotovoltaica',
        detail:     'Advisory · Jurisdicción: NL-AFM/DNB · Contraparte: Renewco Institutional Partners',
        valor:      '750M EUR',
        estado:     'MADURACIÓN',
        estadoStep: '2 / 4',
        badgeClass: 'badge--maturing',
        aml:        { status: 'AML: CLEAR',    color: 'accent'  },
        kyc:        { status: 'KYC: ✓ T-2',    color: 'ghost'   },
        keelClass:  'keel-accent',
        lastUpdate: '2026-05-27',
    }),
    Object.freeze({
        id:         'PRJ-2026-002',
        firstTouch: '2026-05-14',
        label:      'Mandato Advisory — Oil & Gas Colombia',
        detail:     'Advisory · Jurisdicción: CO/SFC · Contraparte: por identificar',
        valor:      '120M USD',
        estado:     'EMBRIONARIO',
        estadoStep: '1 / 4',
        badgeClass: 'badge--embryo',
        aml:        { status: 'AML: PENDIENTE', color: 'warning' },
        kyc:        { status: 'KYC: en curso',  color: 'ghost'   },
        keelClass:  'keel-warn',
        lastUpdate: '2026-05-14',
    }),
]);

/** Actividad reciente mock — v1.3 */
const MOCK_ACTIVITY = Object.freeze([
    { label: 'Documento KYC-T2 subido',      ago: '2d',  sub: 'PRJ-2026-001 · Identidad oficial' },
    { label: 'Mandato PRJ-2026-002 creado',  ago: '15d', sub: 'Advisory · 120M USD · CO/SFC'     },
    { label: 'AML check completado',         ago: '22d', sub: 'PRJ-2026-001 · CLEAR'              },
]);

/** Log AIMON mock — v1.3. Producción: state.aimon.sessionLog */
const MOCK_AIMON_LOG = Object.freeze([
    { ts: '14:22:09Z', level: 'INFO',   text: 'Session initialized. Context: ORBIT_3_CRM_ACTIVE. Role: AGENT.' },
    { ts: '14:22:10Z', level: 'NOTICE', text: 'KYC Tier 3 pending. IntegrityScore gate active at 75.'          },
    { ts: '14:22:11Z', level: 'INFO',   text: 'PRJ-2026-001 compliance check: AML CLEAR. No anomalies.'        },
]);

// [SEC-03] Constantes — CSS (R3 Zero-Hex: solo CSS variables)
const CRM_HOME_STYLES = `
<style id="crm-home-styles">
    /* ── [SEC-03] Tokens locales (R3 compliant — color-mix sobre vars) ─── */
    aip-crm-home {
        --home-warn-bg:     color-mix(in srgb, var(--crm-warning)  5%, transparent);
        --home-warn-border: color-mix(in srgb, var(--crm-warning) 20%, transparent);
        --home-warn-keel:   color-mix(in srgb, var(--crm-warning) 100%, transparent);
        --home-accent-bg:   color-mix(in srgb, var(--crm-accent)   8%, transparent);
        --home-accent-bdr:  color-mix(in srgb, var(--crm-accent)  40%, transparent);
        --home-gold-bg:     color-mix(in srgb, var(--crm-gold)     4%, transparent);
        --home-blocked-bg:  color-mix(in srgb, var(--crm-warning)  4%, transparent);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        background: var(--crm-canvas);
        color: var(--crm-text-primary);
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 13px;
    }

    /* ── Layout principal ───────────────────────────────────────── */
    .crm-home__body         { display: flex; flex: 1; overflow: hidden; }
    .crm-home__sidebar-l    { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto;
                              background: var(--crm-surface); border-right: 1px solid var(--crm-border); }
    .crm-home__main         { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: var(--crm-canvas); }
    .crm-home__sidebar-r    { width: 240px; flex-shrink: 0; display: flex; flex-direction: column; overflow-y: auto;
                              background: var(--crm-surface); border-left: 1px solid var(--crm-border); }

    /* ── Barras de encabezado y pie ─────────────────────────────── */
    .crm-home__topbar       { height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
                              padding: 0 24px; background: var(--crm-abyss); border-bottom: 1px solid var(--crm-border); }
    .crm-home__subbar       { height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
                              padding: 0 24px; background: var(--crm-abyss); border-bottom: 1px solid var(--crm-border); }
    .crm-home__statusbar    { height: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
                              padding: 0 24px; background: var(--crm-abyss); border-top: 1px solid var(--crm-border); }

    /* ── Secciones de sidebar ───────────────────────────────────── */
    .crm-home__section      { padding: 20px; border-bottom: 1px solid var(--crm-border); }
    .crm-home__section:last-child { border-bottom: none; }

    /* ── Labels tipográficos ────────────────────────────────────── */
    .label-xs   { font-size: 9px;  letter-spacing: 0.12em; text-transform: uppercase; }
    .label-sm   { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
    .mono       { font-family: 'JetBrains Mono', monospace; }
    .ghost      { color: var(--crm-text-secondary); }
    .dim        { color: var(--crm-text-dim, var(--crm-text-secondary)); }

    /* ── Score ring SVG ─────────────────────────────────────────── */
    .score-ring { transform: rotate(-90deg); transform-origin: center; }

    /* ── Score bar ──────────────────────────────────────────────── */
    .score-bar-track { height: 3px; background: var(--crm-border); }
    .score-bar-fill  { height: 3px; transition: width 300ms cubic-bezier(0.2,0,0.2,1); }

    /* ── Keel lines ─────────────────────────────────────────────── */
    .keel-accent { border-left: 2px solid var(--crm-accent); }
    .keel-warn   { border-left: 2px solid var(--crm-warning); }
    .keel-gold   { border-left: 2px solid var(--crm-gold); }
    .keel-success{ border-left: 2px solid var(--crm-success); }

    /* ── Keel coupling (B5 — activado por FSM cuando layer_2_document ≠ null) ── */
    aip-crm-home.keel-active { outline: 1px solid color-mix(in srgb, var(--crm-keel-color, var(--crm-accent)) 30%, transparent); }

    /* ── Badges ─────────────────────────────────────────────────── */
    .badge          { display: inline-flex; align-items: center; padding: 2px 7px;
                      font-family: 'JetBrains Mono', monospace; font-size: 9px;
                      letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid; }
    .badge--bronze  { color: var(--crm-bronze);  border-color: color-mix(in srgb, var(--crm-bronze)  35%, transparent); background: color-mix(in srgb, var(--crm-bronze)   6%, transparent); }
    .badge--silver  { color: var(--crm-silver);  border-color: color-mix(in srgb, var(--crm-silver)  35%, transparent); background: color-mix(in srgb, var(--crm-silver)   6%, transparent); }
    .badge--maturing{ color: var(--crm-accent);  border-color: color-mix(in srgb, var(--crm-accent)  35%, transparent); background: color-mix(in srgb, var(--crm-accent)   6%, transparent); }
    .badge--embryo  { color: var(--crm-warning); border-color: color-mix(in srgb, var(--crm-warning) 35%, transparent); background: color-mix(in srgb, var(--crm-warning)  6%, transparent); }
    .badge--blocked { color: var(--crm-danger);  border-color: color-mix(in srgb, var(--crm-danger)  35%, transparent); background: color-mix(in srgb, var(--crm-danger)   6%, transparent); }

    /* ── Buttons ─────────────────────────────────────────────────── */
    .btn-inst {
        padding: 6px 16px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
        background: transparent; color: var(--crm-accent);
        border: 1px solid color-mix(in srgb, var(--crm-accent) 40%, transparent);
        cursor: pointer;
        transition: background 150ms ease, border-color 150ms ease;
    }
    .btn-inst:hover { background: color-mix(in srgb, var(--crm-accent) 8%, transparent); border-color: var(--crm-accent); }
    .btn-inst.btn-primary { background: var(--crm-gold); color: #09101E; border-color: transparent; }
    .btn-inst.btn-primary:hover { background: color-mix(in srgb, var(--crm-gold) 85%, white); }

    /* ── Notice plate (acción requerida) ─────────────────────────── */
    .notice-plate {
        padding: 10px 14px;
        background: var(--home-warn-bg);
        border: 1px solid var(--home-warn-border);
        border-left: 2px solid var(--crm-warning);
        display: flex; align-items: flex-start; gap: 12px;
    }

    /* ── Tabla de proyectos ──────────────────────────────────────── */
    .projects-table         { background: var(--crm-abyss); border: 1px solid var(--crm-border); }
    .projects-table__header { height: 32px; display: flex; align-items: center; gap: 16px; padding: 0 16px;
                              background: var(--crm-surface); border-bottom: 1px solid var(--crm-border); }
    .projects-table__row    { display: flex; align-items: flex-start; gap: 16px; padding: 16px;
                              border-bottom: 1px solid var(--crm-border); cursor: pointer;
                              background: var(--crm-abyss);
                              transition: background 150ms ease; }
    .projects-table__row:last-child { border-bottom: none; }
    .projects-table__row:hover      { background: color-mix(in srgb, var(--crm-text-primary) 2%, var(--crm-abyss)); }
    .col-id    { width: 130px; flex-shrink: 0; }
    .col-desc  { flex: 1; }
    .col-valor { width: 80px; flex-shrink: 0; text-align: right; }
    .col-estado{ width: 110px; flex-shrink: 0; text-align: center; }
    .col-compl { width: 90px; flex-shrink: 0; text-align: center; }
    .col-date  { width: 90px; flex-shrink: 0; text-align: right; }

    /* ── Matching engine bloqueado ───────────────────────────────── */
    .matching-blocked-zone { opacity: 0.35; pointer-events: none; user-select: none; }
    .skeleton-number::after { content: "░░░░.░░"; opacity: 0.4; }
    .skeleton-id::after     { content: "███-████-████"; opacity: 0.4; }
    .skeleton-bar { height: 8px; background: var(--crm-border); }

    /* ── AIMON mini-console ──────────────────────────────────────── */
    .aimon-log-entry { border-top: 1px solid var(--crm-border); padding-top: 6px; font-family: 'JetBrains Mono', monospace; font-size: 9px; }
    .aimon-level--INFO   { color: var(--crm-accent); }
    .aimon-level--NOTICE { color: var(--crm-warning); }
    .aimon-level--WARN   { color: var(--crm-warning); }
    .aimon-level--ERROR  { color: var(--crm-danger); }
    .aimon-input {
        background: transparent; border: none; outline: none;
        font-family: 'JetBrains Mono', monospace; font-size: 10px;
        color: var(--crm-text-primary); width: 100%;
        caret-color: var(--crm-accent);
    }

    /* ── Actividad reciente ──────────────────────────────────────── */
    .activity-item { display: flex; flex-direction: column; gap: 2px; }

    /* ── KYC tier ladder ─────────────────────────────────────────── */
    .kyc-tier { display: flex; align-items: center; gap: 12px; }
    .kyc-tick--ok      { color: var(--crm-success); }
    .kyc-tick--pending { color: var(--crm-warning); }
</style>
`;

// [SEC-04] Clase AipCrmHome — Web Component
class AipCrmHome extends ReactiveElement {

    // [SEC-04a] Campos privados + lifecycle
    #session  = MOCK_SESSION;
    #projects = MOCK_PROJECTS;
    #rendered = false;

    connectedCallback() {
        super.connectedCallback(); // suscripción al store vía ReactiveElement
        console.log('[CrmHome] Portfolio Overview montado.');
    }

    // [SEC-04b] stateChanged — reactividad al store
    // v1.3: lee auth del store real + CRM desde mock.
    // Producción: leer state.session + state.crm cuando existan en state-contract.
    stateChanged(state) {
        if (!state) return;

        // Primer render: construir DOM completo
        if (!this.#rendered) {
            this._render();
            this._wire();
            this.#rendered = true;
            return;
        }

        // Re-renders parciales: actualizar solo lo que cambió
        // v1.3: solo kycStatus del auth real puede provocar re-render
        const kycStatus = state?.auth?.kycStatus;
        if (kycStatus) {
            // Placeholder para lógica real — en v1.3 el mock no cambia
        }
    }

    // [SEC-04c] _render — construcción del DOM
    _render() {
        const s = this.#session;
        const p = this.#projects;

        const matchingBlocked = s.integrityScore < s.integrityThresholds.silver;
        const kycNextTier     = s.kycTiers.find(t => !t.completed);

        // DT-AIP-05: solo datos controlados (mock / store) entran en innerHTML
        this.innerHTML = `
${CRM_HOME_STYLES}

<!-- [§A] Session Context Bar -->
<header class="crm-home__topbar">
    <div style="display:flex;align-items:center;gap:24px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span class="label-xs ghost">OPERADOR</span>
            <span class="mono" style="font-size:11px;">${s.operador}</span>
        </div>
        <div style="width:1px;height:16px;background:var(--crm-border);"></div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge badge--bronze">${s.clearanceLevel}</span>
            <span class="label-xs ghost">CLEARANCE L-${s.clearanceTier}</span>
        </div>
    </div>
    <div style="display:flex;align-items:center;gap:24px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span class="label-xs ghost">SESIÓN</span>
            <span class="mono" style="font-size:10px;color:var(--crm-text-secondary);">${s.sessionTimestamp}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--crm-success);flex-shrink:0;"></span>
            <span class="label-xs" style="color:var(--crm-success);">ACTIVE · ${s.sessionDuration}</span>
        </div>
    </div>
</header>

<!-- [§B] Main body -->
<div class="crm-home__body">

    <!-- Sidebar izquierdo: IntegrityScore + KYC -->
    <aside class="crm-home__sidebar-l">
        <!-- IntegrityScore widget -->
        <div class="crm-home__section">
            <p class="label-xs ghost" style="margin-bottom:16px;">INTEGRITYSCORE</p>
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                ${this._renderScoreRing(s.integrityScore)}
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <span class="mono" style="font-size:10px;color:var(--crm-bronze);">${s.clearanceLevel} TIER</span>
                    <span class="label-xs ghost">UMBRAL SILVER: ${s.integrityThresholds.silver}</span>
                    <span class="label-xs" style="color:var(--crm-warning);">ΔFALTANTE: +${s.integrityThresholds.silver - s.integrityScore} PTS</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
                ${s.scoreComponents.map(c => this._renderScoreBar(c)).join('')}
            </div>
        </div>

        <!-- KYC tier ladder -->
        <div class="crm-home__section">
            <p class="label-xs ghost" style="margin-bottom:12px;">PROTOCOLO KYC</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${s.kycTiers.map(t => `
                <div class="kyc-tier">
                    <span class="mono kyc-tick--${t.completed ? 'ok' : 'pending'}" style="font-size:9px;">${t.completed ? '✓' : '○'}</span>
                    <span style="font-size:11px;color:${t.completed ? 'var(--crm-text-secondary)' : 'var(--crm-warning)'};">Tier ${t.tier} — ${t.label}</span>
                </div>`).join('')}
            </div>
            ${kycNextTier ? `<p style="font-size:9px;color:var(--crm-text-secondary);margin-top:10px;line-height:1.5;">Tier ${kycNextTier.tier} desbloquea: SILVER tier · Proyectos CUALIFICADO · Matching engine</p>` : ''}
        </div>

        <!-- Capacidades -->
        <div class="crm-home__section">
            <p class="label-xs ghost" style="margin-bottom:12px;">CAPACIDADES ACTIVAS</p>
            <div style="display:flex;flex-direction:column;gap:6px;">
                ${s.capacidades.map(c => `
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:11px;color:var(--crm-text-secondary);">${c.label}</span>
                    <span style="font-size:9px;color:${c.activa ? 'var(--crm-success)' : 'var(--crm-danger)'};">${c.activa ? 'ACTIVO' : 'BLOQUEADO'}</span>
                </div>`).join('')}
            </div>
        </div>
    </aside>

    <!-- Columna central: Portfolio -->
    <main class="crm-home__main">

        <!-- Sub-header: breadcrumb + CTAs -->
        <div class="crm-home__subbar">
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="label-sm ghost">CRM</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm">INICIO</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm" style="color:var(--crm-text-secondary);">PORTFOLIO OVERVIEW</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn-inst" data-action-home="NewProject">NUEVO PROYECTO</button>
                ${kycNextTier ? `<button class="btn-inst btn-primary" data-action-home="KycTier" data-tier="${kycNextTier.tier}">INICIAR KYC TIER ${kycNextTier.tier}</button>` : ''}
            </div>
        </div>

        <!-- Notice KYC pendiente -->
        ${kycNextTier ? `
        <div style="margin:20px 24px 0;">
            <div class="notice-plate">
                <span class="mono" style="font-size:11px;color:var(--crm-warning);flex-shrink:0;margin-top:1px;">⚠</span>
                <div>
                    <p class="label-xs" style="color:var(--crm-warning);margin-bottom:3px;">ACCIÓN REQUERIDA — KYC TIER ${kycNextTier.tier}</p>
                    <p style="font-size:11px;color:var(--crm-text-secondary);">
                        Su IntegrityScore actual (${s.integrityScore}) está a ${s.integrityThresholds.silver - s.integrityScore} puntos de SILVER (${s.integrityThresholds.silver}).
                        La completación de KYC Tier ${kycNextTier.tier} (${kycNextTier.label}) añadiría +15 pts —
                        desbloqueando proyectos CUALIFICADO y acceso al matching engine.
                    </p>
                </div>
                <button class="btn-inst" data-action-home="KycTier" data-tier="${kycNextTier.tier}" style="flex-shrink:0;margin-left:auto;">INICIAR</button>
            </div>
        </div>` : ''}

        <!-- Portfolio activo -->
        <div style="padding:24px 24px 0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <p class="label-xs ghost">PORTFOLIO ACTIVO — ${p.length} PROYECTO${p.length !== 1 ? 'S' : ''}</p>
                <div style="display:flex;align-items:center;gap:12px;">
                    <span class="label-xs ghost">FILTRO:</span>
                    <span class="label-xs" style="color:var(--crm-accent);">TODOS</span>
                    <span class="label-xs ghost">EMBRIONARIO</span>
                    <span class="label-xs ghost">MADURACIÓN</span>
                </div>
            </div>

            <div class="projects-table">
                <div class="projects-table__header">
                    <span class="label-xs ghost col-id">PROJECT ID</span>
                    <span class="label-xs ghost col-desc">DESCRIPCIÓN</span>
                    <span class="label-xs ghost col-valor">VALOR</span>
                    <span class="label-xs ghost col-estado">ESTADO</span>
                    <span class="label-xs ghost col-compl">COMPLIANCE</span>
                    <span class="label-xs ghost col-date">ÚLTIMA ACT.</span>
                </div>
                ${p.map(proj => this._renderProjectRow(proj)).join('')}
            </div>
        </div>

        <!-- Matching engine bloqueado / desbloqueado -->
        <div style="padding:24px;">
            <div class="projects-table">
                <div style="height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:var(--crm-surface);border-bottom:1px solid var(--crm-border);">
                    <span class="label-xs ghost">MATCHING ENGINE — OPORTUNIDADES CUALIFICADAS</span>
                    ${matchingBlocked ? `<span class="badge badge--blocked">BLOQUEADO · SCORE &lt; ${s.integrityThresholds.silver}</span>` : '<span class="badge badge--maturing">ACTIVO</span>'}
                </div>
                ${matchingBlocked ? this._renderMatchingBlocked() : '<p style="padding:16px;font-size:11px;color:var(--crm-text-secondary);">Matching engine activo — oportunidades disponibles.</p>'}
                ${matchingBlocked ? `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--crm-border);background:var(--home-blocked-bg);">
                    <p style="font-size:10px;color:var(--crm-text-secondary);">
                        El matching engine publica oportunidades con IntegrityScore ≥ ${s.integrityThresholds.silver} (SILVER).
                        Acceda completando KYC Tier ${kycNextTier?.tier ?? 3}.
                    </p>
                    ${kycNextTier ? `<button class="btn-inst btn-primary" data-action-home="KycTier" data-tier="${kycNextTier.tier}" style="flex-shrink:0;margin-left:16px;">INICIAR KYC TIER ${kycNextTier.tier}</button>` : ''}
                </div>` : ''}
            </div>
        </div>

    </main>

    <!-- Sidebar derecho: AIMON + actividad -->
    <aside class="crm-home__sidebar-r">

        <!-- AIMON mini-console -->
        <div class="crm-home__section">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <p class="label-xs ghost">AIMON</p>
                <span class="badge" style="color:var(--crm-accent);border-color:color-mix(in srgb,var(--crm-accent) 30%,transparent);background:color-mix(in srgb,var(--crm-accent) 5%,transparent);">◈ SYSTEM</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${MOCK_AIMON_LOG.map(entry => `
                <div class="aimon-log-entry">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span style="color:var(--crm-text-secondary);">${entry.ts}</span>
                        <span class="aimon-level--${entry.level}">${entry.level}</span>
                    </div>
                    <p style="color:var(--crm-text-secondary);line-height:1.4;">${entry.text}</p>
                </div>`).join('')}
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:12px;border-top:1px solid var(--crm-border);padding-top:8px;">
                <span class="mono" style="font-size:10px;color:var(--crm-accent);">&gt;</span>
                <input type="text" class="aimon-input" placeholder="_" aria-label="AIMON command input" autocomplete="off">
            </div>
        </div>

        <!-- Actividad reciente -->
        <div class="crm-home__section">
            <p class="label-xs ghost" style="margin-bottom:12px;">ACTIVIDAD RECIENTE</p>
            <div style="display:flex;flex-direction:column;gap:12px;">
                ${MOCK_ACTIVITY.map(act => `
                <div class="activity-item">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-size:10px;color:var(--crm-text-secondary);">${act.label}</span>
                        <span class="mono" style="font-size:9px;color:var(--crm-text-secondary);">${act.ago}</span>
                    </div>
                    <p style="font-size:9px;color:var(--crm-text-secondary);">${act.sub}</p>
                </div>`).join('')}
            </div>
        </div>

        <!-- Próximas acciones -->
        <div class="crm-home__section">
            <p class="label-xs ghost" style="margin-bottom:12px;">PRÓXIMAS ACCIONES</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
                ${kycNextTier ? `<button class="btn-inst btn-primary" data-action-home="KycTier" data-tier="${kycNextTier.tier}" style="width:100%;text-align:left;">[1] KYC TIER ${kycNextTier.tier}</button>` : ''}
                <button class="btn-inst" data-action-home="Workbench" style="width:100%;text-align:left;">[2] VER WORKBENCH →</button>
                <button class="btn-inst" data-action-home="WalletLink" style="width:100%;text-align:left;">[3] VINCULAR WALLET</button>
            </div>
            <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:8px;line-height:1.5;">
                La vinculación de wallet añade +5 pts al IntegrityScore (componente Verificaciones).
            </p>
        </div>

    </aside>
</div>

<!-- [§C] Status bar inferior -->
<footer class="crm-home__statusbar">
    <div style="display:flex;align-items:center;gap:24px;">
        <span class="label-xs ghost">FSM: ORBIT_3_CRM_ACTIVE</span>
        <span class="label-xs ghost">v1.3-skeleton</span>
    </div>
    <div style="display:flex;align-items:center;gap:24px;">
        <span class="label-xs ghost">TRACE: ${s.traceId}</span>
        <span class="label-xs ghost">SCOPE: CRM_BRONZE_AGENT</span>
    </div>
</footer>
        `;
    }

    // [SEC-04d] _wire — event delegation
    _wire() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action-home]');
            if (!btn) return;

            const action = btn.dataset.actionHome;
            const tier   = btn.dataset.tier ? parseInt(btn.dataset.tier, 10) : null;

            switch (action) {
                case 'NewProject':
                    this._onNewProject();
                    break;
                case 'KycTier':
                    this._onKycInitiated(tier);
                    break;
                case 'Workbench':
                    this._onWorkbench();
                    break;
                case 'WalletLink':
                    this._onWalletLink();
                    break;
                case 'SelectProject':
                    this._onProjectSelected(btn.dataset.projectId);
                    break;
            }
        });
    }

    // [SEC-04e] _emit + dispatch — bus canónico + FSM
    _emit(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(eventName, {
            detail: Object.freeze(detail),
            bubbles: true,
        }));
        console.log(`[CrmHome] → ${eventName}`, detail);
    }

    _onNewProject() {
        this.dispatch('PROJECT_CREATE_INITIATED');
        console.log('[CrmHome] PROJECT_CREATE_INITIATED');
    }

    _onKycInitiated(tier) {
        this._emit('Skeleton:CRM:KycInitiated', { tier });
        this.dispatch('KYC_TIER3_INITIATED', { tier });
    }

    _onWorkbench() {
        this.dispatch('CRM_WORKBENCH_REQUESTED');
    }

    _onWalletLink() {
        this._emit('Skeleton:CRM:WalletLinkInitiated');
        this.dispatch('WALLET_LINK_INITIATED');
    }

    _onProjectSelected(projectId) {
        this._emit('Skeleton:CRM:ProjectSelected', { projectId });
    }

    // [SEC-04f] Helpers de render
    /** SVG ring para IntegrityScore. circunferencia = 2π × r (r=28) ≈ 175.93 */
    _renderScoreRing(score) {
        const r            = 28;
        const circumference = +(2 * Math.PI * r).toFixed(2);   // 175.93
        const offset        = +(circumference * (1 - score / 100)).toFixed(2);
        // Color del tier
        const color = score >= 90 ? 'var(--crm-gold)'
                    : score >= 75 ? 'var(--crm-silver)'
                    : 'var(--crm-bronze)';
        return `
        <div style="position:relative;width:72px;height:72px;flex-shrink:0;">
            <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--crm-border)" stroke-width="4"/>
                <circle cx="36" cy="36" r="${r}" fill="none"
                    stroke="${color}" stroke-width="4" stroke-linecap="square"
                    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                    class="score-ring"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                <span class="mono" style="font-size:18px;font-weight:600;color:${color};">${score}</span>
            </div>
        </div>`;
    }

    /** Barra de progreso para cada componente del IntegrityScore */
    _renderScoreBar(component) {
        const pct   = Math.round((component.score / component.max) * 100);
        const color = pct >= 75 ? 'var(--crm-accent)' : 'var(--crm-bronze)';
        return `
        <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span class="label-xs ghost">${component.label}</span>
                <span class="mono" style="font-size:10px;">${component.score} / ${component.max}</span>
            </div>
            <div class="score-bar-track">
                <div class="score-bar-fill" style="width:${pct}%;background:${color};"></div>
            </div>
            <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:2px;">${component.detail}</p>
        </div>`;
    }

    /** Fila de proyecto en la tabla */
    _renderProjectRow(proj) {
        return `
        <div class="projects-table__row ${proj.keelClass}" data-action-home="SelectProject" data-project-id="${proj.id}">
            <div class="col-id">
                <span class="mono" style="font-size:10px;">${proj.id}</span>
                <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:2px;">First-touch: ${proj.firstTouch}</p>
            </div>
            <div class="col-desc">
                <p style="font-size:12px;font-weight:500;margin-bottom:2px;">${proj.label}</p>
                <p style="font-size:10px;color:var(--crm-text-secondary);">${proj.detail}</p>
            </div>
            <div class="col-valor">
                <span class="mono" style="font-size:11px;">${proj.valor}</span>
            </div>
            <div class="col-estado">
                <span class="badge ${proj.badgeClass}">${proj.estado}</span>
                <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:4px;">${proj.estadoStep}</p>
            </div>
            <div class="col-compl">
                <span style="font-size:9px;color:var(--crm-${proj.aml.color});">${proj.aml.status}</span>
                <p style="font-size:9px;color:var(--crm-text-secondary);margin-top:2px;">${proj.kyc.status}</p>
            </div>
            <div class="col-date">
                <span class="mono" style="font-size:10px;color:var(--crm-text-secondary);">${proj.lastUpdate}</span>
            </div>
        </div>`;
    }

    /** Zona matching engine bloqueada (skeleton ghosteado) */
    _renderMatchingBlocked() {
        return `
        <div class="matching-blocked-zone" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
            ${[0, 1].map(() => `
            <div style="display:flex;align-items:center;gap:16px;">
                <div class="mono skeleton-id" style="font-size:10px;color:var(--crm-text-secondary);width:130px;"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                    <div class="skeleton-bar" style="width:60%;"></div>
                    <div class="skeleton-bar" style="width:40%;"></div>
                </div>
                <div class="mono skeleton-number" style="font-size:10px;color:var(--crm-text-secondary);"></div>
                <div class="badge" style="border-color:var(--crm-border);color:var(--crm-text-secondary);">CUALIFICADO</div>
            </div>`).join('')}
        </div>`;
    }

    // [SEC-04g] static mount — API pública de montaje
    /**
     * Monta el componente en el contenedor indicado.
     * Uso canónico (en main.js, tras Skeleton:Legal:Accepted):
     *   AipCrmHome.mount('#crm-orbit-2');
     *
     * @param {string|HTMLElement} container
     * @returns {AipCrmHome|null}
     */
    static mount(container) {
        const el = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!el) {
            console.warn('[CrmHome] mount(): contenedor no encontrado →', container);
            return null;
        }

        const home = document.createElement('aip-crm-home');
        el.replaceChildren(home);
        console.log('[CrmHome] Montado en', typeof container === 'string' ? container : (el.id || el.tagName));
        return home;
    }
}

// [SEC-05] Registro + auto-wire
customElements.define('aip-crm-home', AipCrmHome);

// Auto-wire: mismo patrón que aip-orbit1-tree.js
// Al importar este módulo, el home se monta cuando el usuario supera la atestación.
document.addEventListener('Skeleton:Legal:Accepted', () => {
    AipCrmHome.mount('#crm-orbit-2');
}, { once: true });

export { AipCrmHome };
export default AipCrmHome;
