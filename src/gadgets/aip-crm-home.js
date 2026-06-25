// ============================================================
// ARCHIVO  : aip-crm-home.js
// VERSIÓN  : 1.2.1
// FECHA    : 2026-06-22
// PROPÓSITO: Web Component del HOME de Órbita 2 (CRM Dashboard).
//            Vista de Portfolio Overview + Detalle de Mandato.
//            Montado cuando layer_2_document === null (sin mandato abierto).
//            [VIBE-AIP-S-REBORN-03.7] Trasplante _showMandateDetail desde AIPHandler.js
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — mock data v1.3
// [SEC-03] Constantes — CSS (R3 Zero-Hex: solo CSS variables)
// [SEC-04] Clase AipCrmHome — Web Component
//   [SEC-04a] Campos privados + lifecycle
//   [SEC-04b] stateChanged — reactividad al store
//   [SEC-04c] _render — conmutación Portfolio vs Detalle
//   [SEC-04d] _renderPortfolio — vista de tabla de proyectos
//   [SEC-04e] _renderMandateDetail — trasplante desde AIPHandler.js
//   [SEC-04f] _wire — event delegation + listeners globales
//   [SEC-04g] _emit + dispatch — bus canónico + FSM
//   [SEC-04h] Helpers de render (SVG ring, barras, badge tier)
//   [SEC-04i] static mount — API pública de montaje
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
//   Skeleton:Action:MandateSelected → recibe mandate object (emitido por aip-orbit1-tree)
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
//   Montado en: #crm-orbit-2 (contenedor de Órbita 2)
//   Auto-wire en Skeleton:Legal:Accepted — mismo patrón que aip-orbit1-tree.js
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones y dependencias
import { ReactiveElement } from '../03-interface/base/reactive-element.js';
import { mockState }       from '../verticals/aip/mockState.js';

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

    /* ── Mandate Detail (trasplantado desde AIPHandler.js) ───────── */
    .mandate-detail__header {
        height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
        padding: 0 24px; background: var(--crm-abyss); border-bottom: 1px solid var(--crm-border);
    }
    .mandate-detail__body   { flex: 1; overflow-y: auto; padding: 24px; }
    .workbench              { display: flex; flex-direction: column; gap: 24px; }
    .tearsheet-header       { display: flex; flex-direction: column; gap: 16px; padding: 20px;
                              background: var(--crm-surface); border: 1px solid var(--crm-border); }
    .mandate-identity       { display: flex; align-items: center; gap: 16px; }
    .mandate-id             { font-family: 'JetBrains Mono', monospace; font-size: 10px;
                              letter-spacing: 0.08em; color: var(--crm-text-secondary); }
    .mandate-name           { font-size: 16px; font-weight: 600; }
    .status-badge           { padding: 2px 8px; font-family: 'JetBrains Mono', monospace; font-size: 9px;
                              letter-spacing: 0.08em; text-transform: uppercase;
                              border: 1px solid var(--crm-border); color: var(--crm-text-secondary); }
    .kpi-ribbon             { display: flex; gap: 24px; flex-wrap: wrap; }
    .kpi-cell               { display: flex; flex-direction: column; gap: 4px; }
    .kpi-label              { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--crm-text-secondary); }
    .kpi-value              { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; }
    .kpi-meta               { font-size: 9px; color: var(--crm-text-secondary); }
    .panel-left             { display: flex; flex-direction: column; gap: 16px; }
    .panel-right            { display: flex; flex-direction: column; gap: 12px; }
    .counterparty-grid      { display: flex; gap: 0; border: 1px solid var(--crm-border); }
    .grid-frozen            { border-right: 1px solid var(--crm-border); }
    .grid-scrollable        { overflow-x: auto; }
    .grid-row               { display: flex; align-items: center; height: 32px; padding: 0 12px; }
    .grid-row.header        { background: var(--crm-surface); border-bottom: 1px solid var(--crm-border); }
    .col-role               { width: 40px; font-family: 'JetBrains Mono', monospace; font-size: 10px; }
    .col-entity             { width: 160px; font-size: 11px; }
    .col-status             { width: 60px; }
    .col-kyc                { width: 60px; font-family: 'JetBrains Mono', monospace; font-size: 10px; }
    .col-docs               { width: 60px; }
    .col-commit             { width: 80px; }
    .col-juris              { width: 50px; font-family: 'JetBrains Mono', monospace; font-size: 10px; }
    .status-dot             { width: 6px; height: 6px; border-radius: 50%; background: var(--crm-success); display: inline-block; }
    .kyc-bar                { font-size: 10px; letter-spacing: 0.1em; }
    .timeline-node          { padding: 12px; background: var(--crm-surface); border: 1px solid var(--crm-border); }
    .node-header            { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .node-symbol            { font-size: 12px; }
    .node-title             { font-size: 11px; font-weight: 500; flex: 1; }
    .node-timestamp         { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--crm-text-secondary); }
    .audit-badge            { padding: 1px 6px; font-size: 8px; letter-spacing: 0.08em;
                              border: 1px solid var(--crm-border); color: var(--crm-text-secondary); }
    .node-detail            { font-size: 11px; color: var(--crm-text-secondary); line-height: 1.5; }
    .evidence-line          { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--crm-text-dim);
                              margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--crm-border); }

    /* ── [CRM-TREE-03] Procedure View ──────────────────────────── */
    .proc-view              { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .proc-market-note       { padding: 12px 16px;
                              background: color-mix(in srgb, var(--crm-accent) 5%, transparent);
                              border-left: 2px solid var(--crm-accent);
                              font-size: 11px; color: var(--crm-text-secondary); line-height: 1.6; }
    .proc-steps             { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--crm-border); }
    .proc-step              { display: flex; gap: 16px; padding: 16px;
                              border-bottom: 1px solid var(--crm-border); background: var(--crm-abyss); }
    .proc-step:last-child   { border-bottom: none; }
    .proc-step__num         { width: 24px; height: 24px; flex-shrink: 0;
                              display: flex; align-items: center; justify-content: center;
                              background: color-mix(in srgb, var(--crm-accent) 12%, transparent);
                              border: 1px solid color-mix(in srgb, var(--crm-accent) 30%, transparent);
                              font-family: 'JetBrains Mono', monospace; font-size: 10px;
                              color: var(--crm-accent); }
    .proc-step__body        { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .proc-step__title       { font-size: 12px; font-weight: 500; }
    .proc-step__desc        { font-size: 11px; color: var(--crm-text-secondary); line-height: 1.5; }
    .proc-step__docs        { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
    .proc-doc-card          { display: flex; align-items: center; gap: 8px; padding: 6px 10px;
                              background: var(--crm-surface); border: 1px solid var(--crm-border);
                              cursor: pointer; transition: border-color 150ms ease; }
    .proc-doc-card:hover    { border-color: var(--crm-accent); }
    .proc-doc-card__icon    { font-size: 12px; color: var(--crm-text-secondary); }
    .proc-doc-card__label   { font-size: 10px; }
    .proc-doc-card__type    { font-size: 9px; color: var(--crm-text-secondary); letter-spacing: 0.06em; text-transform: uppercase; }
    .proc-sla               { font-family: 'JetBrains Mono', monospace; font-size: 9px;
                              color: var(--crm-warning); margin-top: 4px; }
    .proc-cta-zone          { padding: 20px; background: var(--crm-surface); border: 1px solid var(--crm-border);
                              display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }

    /* ── [CRM-TREE-03] Opportunity View ────────────────────────── */
    .opp-view               { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .opp-gate-banner        { padding: 16px;
                              background: color-mix(in srgb, var(--crm-warning) 5%, transparent);
                              border: 1px solid color-mix(in srgb, var(--crm-warning) 20%, transparent);
                              border-left: 2px solid var(--crm-warning);
                              display: flex; flex-direction: column; gap: 12px; }
    .opp-gate__progress     { height: 6px; background: var(--crm-border); position: relative; }
    .opp-gate__fill         { height: 6px; background: var(--crm-warning); transition: width 400ms ease; }
    .opp-teasers            { display: flex; flex-direction: column; gap: 12px; }
    .opp-teaser-card        { display: flex; align-items: center; gap: 16px; padding: 14px 16px;
                              background: var(--crm-surface); border: 1px solid var(--crm-border);
                              border-left: 2px solid var(--crm-gold);
                              position: relative; overflow: hidden; }
    .opp-teaser-card--locked { opacity: 0.55; pointer-events: none; }
    .opp-teaser-card--locked::after {
                              content: ''; position: absolute; inset: 0;
                              background: repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 4px,
                                color-mix(in srgb, var(--crm-border) 40%, transparent) 4px,
                                color-mix(in srgb, var(--crm-border) 40%, transparent) 5px
                              ); pointer-events: none; }
    .opp-teaser__id         { font-family: 'JetBrains Mono', monospace; font-size: 9px;
                              color: var(--crm-text-secondary); width: 110px; flex-shrink: 0; }
    .opp-teaser__label      { flex: 1; font-size: 12px; font-weight: 500; }
    .opp-teaser__meta       { font-size: 10px; color: var(--crm-text-secondary); margin-top: 2px; }
    .opp-teaser__value      { font-family: 'JetBrains Mono', monospace; font-size: 11px;
                              color: var(--crm-gold); text-align: right; flex-shrink: 0; }
    .opp-teaser__status     { flex-shrink: 0; }
    .opp-empty-state        { padding: 20px; background: var(--crm-surface); border: 1px solid var(--crm-border);
                              text-align: center; }
</style>
`;

// [SEC-04] Clase AipCrmHome — Web Component
class AipCrmHome extends ReactiveElement {

    // [SEC-04a] Campos privados + lifecycle
    #session          = MOCK_SESSION;
    #projects         = MOCK_PROJECTS;
    #rendered         = false;
    #selectedMandate  = null;    // [VIBE-03.7] Portfolio ↔ MandateDetail
    #selectedCategory = null;    // [CRM-TREE-03] Portfolio ↔ ProcedureView / OpportunityView
    #selectedLayer    = 'procedure'; // 'procedure' | 'opportunity'
    #selectedDomain   = null;    // [CRM-VIEWS-01] DomainFocus (L1) → domainOverview view

    connectedCallback() {
        super.connectedCallback(); // suscripción al store vía ReactiveElement
        console.log('[CrmHome] Portfolio Overview montado.');
    }

    // [ACC-02] Hidrata #session desde identidad real en PassportEngine + store.
    // Preserva el shape de MOCK_SESSION para campos que aún no tienen fuente real (Forja 9+).
    _hydrateIdentity(state) {
        const LEVEL_LABELS = ['GUEST', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        const identity = window.Skeleton?.PassportEngine?.getIdentity?.();
        if (!identity) return;
        const clearanceIdx  = Math.min(identity.clearance ?? 0, 4);
        const ROLE_LABELS   = { inv: 'Inversor AIP', agent: 'Agente AIP', admin: 'Admin AIP', guest: 'Invitado' };
        this.#session = {
            ...MOCK_SESSION,
            operador:       ROLE_LABELS[state.auth.role] ?? 'Operador AIP',
            clearanceLevel: LEVEL_LABELS[clearanceIdx],
            clearanceTier:  clearanceIdx,
            integrityScore: identity.integrity_score ?? 0,
        };
    }

    // [SEC-04b] stateChanged — reactividad al store
    stateChanged(state) {
        if (!state) return;

        // [ACC-02] Hidratar identidad real antes de cualquier render
        if (state.auth?.isAuthenticated) {
            this._hydrateIdentity(state);
        }

        // Primer render: construir DOM completo
        if (!this.#rendered) {
            this._render();
            this._wire();
            this.#rendered = true;
            return;
        }

        // Re-renders parciales: refrescar si la identidad cambió
        if (state.auth?.isAuthenticated) {
            this._render();
        }
    }

    // [SEC-04c] _render — conmutación Portfolio vs Detalle
    _render() {
        const s = this.#session;
        const p = this.#projects;

        // DT-AIP-05: solo datos controlados (mock / store) entran en innerHTML
        this.innerHTML = `
${CRM_HOME_STYLES}

<!-- [§A] Session Context Bar -->
<header class="crm-home__topbar">
    <div style="display:flex;align-items:center;gap:24px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span class="label-xs">OPERADOR</span>
            <span class="mono" style="font-size:11px;">${s.operador}</span>
        </div>
        <div style="width:1px;height:16px;background:var(--crm-border);"></div>
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge badge--bronze">${s.clearanceLevel}</span>
            <span class="label-xs">CLEARANCE L-${s.clearanceTier}</span>
        </div>
    </div>
    <div style="display:flex;align-items:center;gap:24px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span class="label-xs">SESIÓN</span>
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
    <main class="crm-home__main" id="crm-home-view-container"></main>
</div>

<!-- [§C] Status bar inferior -->
<footer class="crm-home__statusbar">
    <div style="display:flex;align-items:center;gap:24px;">
        <span class="label-xs">FSM: ORBIT_3_CRM_ACTIVE</span>
        <span class="label-xs">v1.3-skeleton</span>
    </div>
    <div style="display:flex;align-items:center;gap:24px;">
        <span class="label-xs">TRACE: ${s.traceId}</span>
        <span class="label-xs">SCOPE: CRM_BRONZE_AGENT</span>
    </div>
</footer>
        `;

        // Conmutación de vista interna — orden de prioridad:
        // 1. MandateDetail (L3)   2. ProcedureView (L2-PROC)
        // 3. OpportunityView (L2-OPP)   4. DomainOverview (L1)   5. Portfolio (home)
        const container = this.querySelector('#crm-home-view-container');
        if (this.#selectedMandate) {
            this._renderMandateDetail(container, this.#selectedMandate);
        } else if (this.#selectedCategory && this.#selectedLayer === 'procedure') {
            this._renderProcedureView(container, this.#selectedCategory);
        } else if (this.#selectedCategory && this.#selectedLayer === 'opportunity') {
            this._renderOpportunityView(container, this.#selectedCategory);
        } else if (this.#selectedDomain) {
            this._renderDomainOverview(container, this.#selectedDomain);
        } else {
            this._renderPortfolio(container, s, p);
        }
    }

    // [SEC-04d] _renderPortfolio — vista de tabla de proyectos
    _renderPortfolio(container, s, p) {
        const matchingBlocked = s.integrityScore < s.integrityThresholds.silver;
        const kycNextTier     = s.kycTiers.find(t => !t.completed);

        // DT-AIP-05: solo datos controlados (MOCK_SESSION / MOCK_PROJECTS) en innerHTML
        container.innerHTML = `
        <!-- Sub-header: breadcrumb + CTAs -->
        <div class="crm-home__subbar">
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="label-sm">CRM</span>
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
                <p class="label-xs">PORTFOLIO ACTIVO — ${p.length} PROYECTO${p.length !== 1 ? 'S' : ''}</p>
                <div style="display:flex;align-items:center;gap:12px;">
                    <span class="label-xs">FILTRO:</span>
                    <span class="label-xs" style="color:var(--crm-accent);">TODOS</span>
                    <span class="label-xs">EMBRIONARIO</span>
                    <span class="label-xs">MADURACIÓN</span>
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
                    <span class="label-xs">MATCHING ENGINE — OPORTUNIDADES CUALIFICADAS</span>
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
        `;
    }

    // [SEC-04d2] _renderProcedureView — CRM-TREE-03 · 2026-05-31
    // Renderiza el itinerario operativo de un nodo L2 del árbol.
    // DT-AIP-05: todos los datos vienen de mockState (deepFrozen) — innerHTML seguro.
    _renderProcedureView(container, categoryData) {
        const proc = categoryData.procedure;
        const docs = mockState?.documents ?? {};

        container.innerHTML = `
        <!-- Sub-header breadcrumb -->
        <div class="crm-home__subbar">
            <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn-inst" data-action-home="BackToPortfolio" style="padding:4px 12px;font-size:9px;">← VOLVER</button>
                <span class="label-sm ghost">/</span>
                <span class="label-sm ghost">CRM</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm">${categoryData.label}</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm" style="color:var(--crm-accent);">PROCEDIMIENTO</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="badge badge--maturing">PROC · ACCESO LIBRE</span>
            </div>
        </div>

        <!-- Cuerpo de la vista -->
        <div class="proc-view">

            <!-- Headline + market note -->
            <div style="display:flex;flex-direction:column;gap:8px;">
                <p class="label-xs ghost">ITINERARIO OPERATIVO</p>
                <h2 style="font-size:15px;font-weight:600;">${proc.headline}</h2>
                <div class="proc-market-note">${proc.market_note}</div>
            </div>

            <!-- Steps -->
            <div>
                <p class="label-xs ghost" style="margin-bottom:12px;">PASOS DEL PROCEDIMIENTO</p>
                <div class="proc-steps">
                    ${proc.steps.map(step => {
                        const stepDocs = (step.documents ?? []).map(docId => {
                            const doc = docs[docId];
                            if (!doc) return '';
                            const isQuestionnaire = doc.type === 'questionnaire';
                            const mailSubject = encodeURIComponent(`[METALES] Cuestionario ${doc.label} — ${MOCK_SESSION.operador}`);
                            return `
                            <div class="proc-doc-card" data-action-home="DownloadDoc" data-doc-id="${docId}">
                                <span class="proc-doc-card__icon">📄</span>
                                <div style="display:flex;flex-direction:column;gap:1px;">
                                    <span class="proc-doc-card__label">${doc.label}</span>
                                    <span class="proc-doc-card__type">${doc.type}</span>
                                </div>
                                ${isQuestionnaire ? `
                                <a href="mailto:admin@breederhub.store?subject=${mailSubject}" class="btn-inst" style="padding:3px 10px;font-size:9px;margin-left:8px;text-decoration:none;">
                                    ✉ ENVIAR
                                </a>` : ''}
                                ${doc.downloadUrl ? `
                                <a href="${doc.downloadUrl}" target="_blank" class="btn-inst" style="padding:3px 10px;font-size:9px;margin-left:4px;text-decoration:none;">
                                    ⬇ PDF
                                </a>` : `
                                <span class="label-xs ghost" style="margin-left:8px;" title="PDF disponible tras upload Firebase (CRM-DOCS-01)">⬇ PDF próximo</span>`}
                            </div>`;
                        }).join('');

                        return `
                        <div class="proc-step">
                            <div class="proc-step__num">${step.order}</div>
                            <div class="proc-step__body">
                                <span class="proc-step__title">${step.title}</span>
                                <p class="proc-step__desc">${step.description}</p>
                                ${stepDocs ? `<div class="proc-step__docs">${stepDocs}</div>` : ''}
                                ${step.sla ? `<p class="proc-sla">⧗ SLA: ${step.sla}</p>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- CTA Final -->
            <div class="proc-cta-zone">
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <p class="label-xs" style="color:var(--crm-gold);">${proc.propose_cta.label}</p>
                    <p style="font-size:11px;color:var(--crm-text-secondary);">${proc.propose_cta.description}</p>
                </div>
                <div style="display:flex;gap:8px;flex-shrink:0;">
                    <button class="btn-inst" data-action-home="OpenOutputSimulator" data-category-id="${categoryData.id}" style="padding:8px 14px;">
                        ◎ SIMULAR OUTPUT
                    </button>
                    <a href="${proc.propose_cta.contact}" class="btn-inst btn-primary" style="text-decoration:none;padding:8px 20px;">
                        → PROPONER OPERACIÓN
                    </a>
                </div>
            </div>

        </div>`;
    }

    // [SEC-04d3] _renderOpportunityView — CRM-TREE-03 · 2026-05-31
    // Renderiza los teasers de mandatos activos para un nodo L2.
    // Gate: IntegrityScore del usuario vs unlock_threshold de la categoría.
    // DT-AIP-05: todos los datos vienen de mockState (deepFrozen) — innerHTML seguro.
    _renderOpportunityView(container, categoryData) {
        const opp        = categoryData.opportunities;
        const threshold  = opp.unlock_threshold.integrityScore;
        const userScore  = this.#session.integrityScore;
        const isUnlocked = userScore >= threshold;
        const kycNeeded  = opp.unlock_threshold.kycTier;
        const nextTier   = this.#session.kycTiers.find(t => !t.completed);
        const scorePct   = Math.min(100, Math.round((userScore / threshold) * 100));

        container.innerHTML = `
        <!-- Sub-header breadcrumb -->
        <div class="crm-home__subbar">
            <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn-inst" data-action-home="BackToPortfolio" style="padding:4px 12px;font-size:9px;">← VOLVER</button>
                <span class="label-sm ghost">/</span>
                <span class="label-sm ghost">CRM</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm">${categoryData.label}</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm" style="color:var(--crm-gold);">OPORTUNIDADES</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                ${isUnlocked
                    ? `<span class="badge badge--maturing">ACCESO DESBLOQUEADO</span>`
                    : `<span class="badge badge--blocked">SCORE ${userScore} / ${threshold} — BLOQUEADO</span>`}
            </div>
        </div>

        <div class="opp-view">

            ${!isUnlocked ? `
            <!-- Gate banner -->
            <div class="opp-gate-banner">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div>
                        <p class="label-xs" style="color:var(--crm-warning);margin-bottom:4px;">
                            ACCESO RESTRINGIDO — INTEGRITY SCORE INSUFICIENTE
                        </p>
                        <p style="font-size:11px;color:var(--crm-text-secondary);">
                            IntegrityScore actual: <span class="mono" style="color:var(--crm-warning);">${userScore}</span>
                            de <span class="mono">${threshold}</span> requeridos (SILVER · KYC Tier ${kycNeeded}).
                            ${nextTier ? `Completar KYC Tier ${nextTier.tier} (${nextTier.label}) añade +15 pts.` : ''}
                        </p>
                    </div>
                    ${nextTier ? `<button class="btn-inst btn-primary" data-action-home="KycTier" data-tier="${nextTier.tier}" style="flex-shrink:0;">COMPLETAR KYC TIER ${nextTier.tier}</button>` : ''}
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span class="label-xs ghost">PROGRESO HACIA SILVER</span>
                        <span class="mono" style="font-size:9px;">${userScore} / ${threshold}</span>
                    </div>
                    <div class="opp-gate__progress">
                        <div class="opp-gate__fill" style="width:${scorePct}%;"></div>
                    </div>
                </div>
            </div>` : ''}

            <!-- Teasers de mandatos -->
            <div>
                <p class="label-xs ghost" style="margin-bottom:12px;">
                    MANDATOS ACTIVOS — ${opp.teasers.length} POSICIÓN${opp.teasers.length !== 1 ? 'ES' : ''}
                </p>
                ${opp.teasers.length > 0 ? `
                <div class="opp-teasers">
                    ${opp.teasers.map(teaser => {
                        const cardClass = isUnlocked ? 'opp-teaser-card' : 'opp-teaser-card opp-teaser-card--locked';
                        const clickAttr = isUnlocked ? `data-action-home="OpenTeaser" data-mandate-id="${teaser.id}"` : '';
                        return `
                        <div class="${cardClass}" ${clickAttr} style="${isUnlocked ? 'cursor:pointer;' : ''}">
                            <div class="opp-teaser__id mono">${teaser.id}</div>
                            <div style="flex:1;">
                                <p class="opp-teaser__label">${teaser.category_label}</p>
                                <p class="opp-teaser__meta">${teaser.dealType ?? teaser.type} · ${teaser.locations ?? ''}</p>
                            </div>
                            <div style="text-align:right;">
                                <p class="opp-teaser__value">${teaser.value_range}</p>
                                <span class="badge ${isUnlocked ? 'badge--maturing' : ''}" style="margin-top:4px;">${teaser.status}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>` : `
                <div class="opp-empty-state">
                    <p style="font-size:12px;color:var(--crm-text-secondary);margin-bottom:8px;">${opp.empty_state.text}</p>
                    <p style="font-size:10px;color:var(--crm-text-dim);">${opp.empty_state.cta}</p>
                </div>`}
            </div>

            <!-- CTA proponer -->
            <div class="proc-cta-zone">
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <p class="label-xs" style="color:var(--crm-gold);">¿Tienes material disponible?</p>
                    <p style="font-size:11px;color:var(--crm-text-secondary);">
                        Las oportunidades en ${categoryData.labelShort} también se crean ad hoc — no es necesario esperar a que estén publicadas.
                    </p>
                </div>
                <a href="mailto:admin@breederhub.store?subject=[PROPUESTA ${categoryData.labelShort.toUpperCase()}] Posición disponible" class="btn-inst" style="flex-shrink:0;text-decoration:none;padding:8px 16px;">
                    → PROPONER POSICIÓN
                </a>
            </div>

        </div>`;
    }

    // [SEC-04e] _renderMandateDetail — trasplante desde AIPHandler.js
    // [DT-AIP-07 Cycle 3] ARQ-FIND-11 cerrado · 2026-05-31
    // DT-AIP-05: createElement + textContent, nunca innerHTML con datos del mandato
    _renderMandateDetail(container, mandate) {
        container.textContent = ''; // Limpieza fiduciaria

        // ── Header del detalle con botón Volver ─────────────────────────────
        const header = document.createElement('div');
        header.className = 'mandate-detail__header';

        const breadcrumb = document.createElement('div');
        breadcrumb.style.cssText = 'display:flex;align-items:center;gap:8px;';

        const backBtn = document.createElement('button');
        backBtn.className = 'btn-inst';
        backBtn.style.cssText = 'padding:4px 12px;font-size:9px;';
        backBtn.textContent = '← VOLVER';
        backBtn.dataset.actionHome = 'BackToPortfolio';

        const sep1 = document.createElement('span');
        sep1.className = 'label-sm ghost';
        sep1.textContent = '/';

        const sep2 = document.createElement('span');
        sep2.className = 'label-sm ghost';
        sep2.textContent = '/';

        const crumbId = document.createElement('span');
        crumbId.className = 'label-sm';
        crumbId.textContent = mandate.mandateId ?? '—';

        const crumbName = document.createElement('span');
        crumbName.className = 'label-sm';
        crumbName.style.color = 'var(--crm-text-secondary)';
        crumbName.textContent = mandate.asset?.spec ?? mandate.asset?.class ?? mandate.type ?? '—';

        breadcrumb.append(backBtn, sep1, crumbId, sep2, crumbName);
        header.appendChild(breadcrumb);
        container.appendChild(header);

        // ── Body del detalle ────────────────────────────────────────────────
        const body = document.createElement('div');
        body.className = 'mandate-detail__body';

        const workbench = document.createElement('div');
        workbench.className = 'workbench';

        // ── TEARSHEET HEADER ───────────────────────────────────────────────
        const tHeader = document.createElement('div');
        tHeader.className = 'tearsheet-header';

        const identity = document.createElement('div');
        identity.className = 'mandate-identity';

        const mId = document.createElement('span');
        mId.className = 'mandate-id';
        mId.textContent = mandate.mandateId ?? '—';

        const mName = document.createElement('span');
        mName.className = 'mandate-name';
        mName.textContent = mandate.asset?.spec ?? mandate.asset?.class ?? '—';

        const mStateBadge = document.createElement('span');
        mStateBadge.className = 'status-badge';
        mStateBadge.textContent = mandate.fiduciaryState ?? '—';

        identity.append(mId, mName, mStateBadge);

        const kpiRibbon = document.createElement('div');
        kpiRibbon.className = 'kpi-ribbon';

        const amt = mandate.asset?.estimatedValue;
        const kpiData = [
            { label: 'Valor Est.', value: amt ? `$${(amt / 1_000_000).toFixed(0)}M` : '—', meta: mandate.asset?.currency ?? '' },
            { label: 'Incoterm',   value: mandate.asset?.incoterm ?? '—', meta: '' },
            { label: 'Calidad',    value: mandate.asset?.class ?? '—', meta: mandate.asset?.quantity ?? '' },
            { label: 'Cert. SGS',  value: mandate.compliance?.sgsCertificate ?? '—', meta: '' },
            { label: 'SBLC',       value: mandate.compliance?.sblcProvider ?? '—', meta: '' },
            { label: 'KYC Tier',   value: `Tier ${mandate.compliance?.kycTier ?? '?'}`, meta: mandate.compliance?.amlClear ? 'AML ✓' : 'AML —' },
        ];

        kpiData.forEach(({ label, value, meta }) => {
            const cell = document.createElement('div');
            cell.className = 'kpi-cell';

            const lbl = document.createElement('span');
            lbl.className = 'kpi-label';
            lbl.textContent = label;

            const val = document.createElement('span');
            val.className = 'kpi-value';
            val.textContent = value;

            cell.append(lbl, val);

            if (meta) {
                const m = document.createElement('span');
                m.className = 'kpi-meta';
                m.textContent = meta;
                cell.append(m);
            }
            kpiRibbon.append(cell);
        });

        tHeader.append(identity, kpiRibbon);
        workbench.append(tHeader);

        // ── PANEL LEFT ──────────────────────────────────────────────────────
        const panelLeft = document.createElement('div');
        panelLeft.className = 'panel-left';

        const cpTitle = document.createElement('p');
        cpTitle.className = 'kpi-label';
        cpTitle.textContent = 'Matriz de Contrapartes';

        const cpGrid = document.createElement('div');
        cpGrid.className = 'counterparty-grid';

        const frozen = document.createElement('div');
        frozen.className = 'grid-frozen';
        const scrollable = document.createElement('div');
        scrollable.className = 'grid-scrollable';

        const frozenHdr = document.createElement('div');
        frozenHdr.className = 'grid-row header';
        ['#', 'Entidad'].forEach((h, i) => {
            const col = document.createElement('div');
            col.className = i === 0 ? 'col-role' : 'col-entity';
            col.textContent = h;
            frozenHdr.append(col);
        });

        const scrollHdr = document.createElement('div');
        scrollHdr.className = 'grid-row header';
        [
            { text: 'Estado',      cls: 'col-status' },
            { text: 'KYC',         cls: 'col-kyc'    },
            { text: 'Docs',        cls: 'col-docs'   },
            { text: 'Compromiso',  cls: 'col-commit' },
            { text: 'Juris.',      cls: 'col-juris'  },
        ].forEach(({ text, cls }) => {
            const col = document.createElement('div');
            col.className = cls;
            col.textContent = text;
            scrollHdr.append(col);
        });

        frozen.append(frozenHdr);
        scrollable.append(scrollHdr);

        const parties = [];
        if (mandate.parties?.originator)
            parties.push({ role: 'ORG', entity: mandate.parties.originator, kyc: '▓▓▓▓▓', commit: '—', juris: 'UY' });
        if (mandate.parties?.client)
            parties.push({ role: 'CLI', entity: mandate.parties.client, kyc: '▓▓▓░░', commit: '—', juris: 'ES' });
        if (Array.isArray(mandate.parties?.counterparties)) {
            mandate.parties.counterparties.forEach(cp =>
                parties.push({ role: 'CP', entity: cp, kyc: '▓▓░░░', commit: '—', juris: 'NL' })
            );
        }

        parties.forEach(p => {
            const fRow = document.createElement('div');
            fRow.className = 'grid-row';
            const roleCell = document.createElement('div');
            roleCell.className = 'col-role';
            roleCell.textContent = p.role;
            const entityCell = document.createElement('div');
            entityCell.className = 'col-entity';
            entityCell.textContent = p.entity;
            fRow.append(roleCell, entityCell);
            frozen.append(fRow);

            const sRow = document.createElement('div');
            sRow.className = 'grid-row';

            const dotDiv = document.createElement('div');
            dotDiv.className = 'col-status';
            const dot = document.createElement('span');
            dot.className = 'status-dot';
            dotDiv.append(dot);

            const kycDiv = document.createElement('div');
            kycDiv.className = 'col-kyc';
            const kycBar = document.createElement('span');
            kycBar.className = 'kyc-bar';
            kycBar.textContent = p.kyc;
            kycDiv.append(kycBar);

            const docsDiv = document.createElement('div');
            docsDiv.className = 'col-docs';
            docsDiv.textContent = '—';

            const commitDiv = document.createElement('div');
            commitDiv.className = 'col-commit';
            commitDiv.textContent = p.commit;

            const jurisDiv = document.createElement('div');
            jurisDiv.className = 'col-juris';
            jurisDiv.textContent = p.juris;

            sRow.append(dotDiv, kycDiv, docsDiv, commitDiv, jurisDiv);
            scrollable.append(sRow);
        });

        cpGrid.append(frozen, scrollable);
        panelLeft.append(cpTitle, cpGrid);

        const termsTitle = document.createElement('p');
        termsTitle.className = 'kpi-label';
        termsTitle.style.marginTop = '24px';
        termsTitle.textContent = 'Condiciones del Mandato';

        const termsData = [
            { label: 'Tipo de operación', value: mandate.type ?? '—' },
            { label: 'Activo',            value: mandate.asset?.class ?? '—' },
            { label: 'Especificación',    value: mandate.asset?.spec ?? '—' },
            { label: 'Volumen',           value: mandate.asset?.quantity ?? '—' },
            { label: 'Incoterm',          value: mandate.asset?.incoterm ?? '—' },
            { label: 'Creación',          value: mandate.timeline?.created ?? '—' },
            { label: 'Cierre objetivo',   value: mandate.timeline?.targetClose ?? '—' },
            { label: 'Último contacto',   value: mandate.timeline?.lastActivity ?? '—' },
            { label: 'Próximo hito',      value: mandate.timeline?.nextMilestone ?? '—' },
        ];

        const termsGrid = document.createElement('div');
        termsGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;margin-top:8px;';

        termsData.forEach(({ label, value }) => {
            const item = document.createElement('div');

            const lbl = document.createElement('span');
            lbl.className = 'kpi-label';
            lbl.textContent = label;

            const val = document.createElement('span');
            val.style.cssText = 'display:block;font-size:11px;color:var(--crm-text-primary);margin-top:2px;';
            val.textContent = value;

            item.append(lbl, val);
            termsGrid.append(item);
        });

        panelLeft.append(termsTitle, termsGrid);
        workbench.append(panelLeft);

        // ── PANEL RIGHT — Audit Trail ───────────────────────────────────────
        const panelRight = document.createElement('div');
        panelRight.className = 'panel-right';

        const auditTitle = document.createElement('p');
        auditTitle.className = 'kpi-label';
        auditTitle.textContent = 'Auditoría de Cumplimiento';
        panelRight.append(auditTitle);

        const c = mandate.compliance ?? {};
        const milestones = [
            {
                category: 'LEGAL',
                symbol: '✓',
                title: 'NDA / NCNDA Firmado',
                timestamp: mandate.timeline?.created ?? '—',
                status: c.ncndaSigned ? 'VERIFIED' : 'PENDING',
                detail: `NDA/NCNDA firmado. Estado: ${c.ncndaSigned ? 'Vigente' : 'Pendiente'}.`,
                evidence: `ncnda_signed=${c.ncndaSigned}`,
            },
            {
                category: 'LEGAL',
                symbol: '✓',
                title: 'AML / Sanctions Check',
                timestamp: mandate.timeline?.lastActivity ?? '—',
                status: (c.amlClear && c.sanctionsCheck) ? 'VERIFIED' : 'PENDING',
                detail: `AML Clear: ${c.amlClear}. Sanctions: ${c.sanctionsCheck}.`,
                evidence: `aml=${c.amlClear} · sanctions=${c.sanctionsCheck}`,
            },
            {
                category: 'LEGAL',
                symbol: '⧖',
                title: `KYC Tier ${c.kycTier} Due Diligence`,
                timestamp: mandate.timeline?.nextMilestone ?? '—',
                status: 'PENDING',
                detail: `Próximo hito: ${mandate.timeline?.nextMilestone ?? '—'}`,
                evidence: `kyc_tier=${c.kycTier} · sblc_provider=${c.sblcProvider ?? '—'}`,
            },
            {
                category: 'BLOCKER',
                symbol: '!',
                title: 'Certificado SGS',
                timestamp: mandate.timeline?.lastActivity ?? '—',
                status: c.sgsCertificate ? 'VERIFIED' : 'BLOCKER',
                detail: c.sgsCertificate
                    ? `Certificado emitido: ${c.sgsCertificate}`
                    : 'Pendiente emisión certificado SGS.',
                evidence: c.sgsCertificate ? `sgs=${c.sgsCertificate}` : 'sgs=MISSING',
            },
        ];

        if (Array.isArray(mandate.notes)) {
            mandate.notes.forEach((note, i) => milestones.push({
                category: 'LEGAL',
                symbol: '›',
                title: `Nota ${i + 1}`,
                timestamp: mandate.timeline?.lastActivity ?? '—',
                status: 'VERIFIED',
                detail: note,
                evidence: `note_index=${i}`,
            }));
        }

        milestones.forEach(({ category, symbol, title, timestamp, status, detail, evidence }) => {
            const node = document.createElement('div');
            node.className = 'timeline-node';
            node.dataset.category = category;

            const nodeHdr = document.createElement('div');
            nodeHdr.className = 'node-header';

            const sym = document.createElement('span');
            sym.className = 'node-symbol';
            sym.textContent = symbol;

            const tit = document.createElement('span');
            tit.className = 'node-title';
            tit.textContent = title;

            const ts = document.createElement('span');
            ts.className = 'node-timestamp';
            ts.textContent = timestamp;

            const badge = document.createElement('span');
            badge.className = 'audit-badge';
            badge.textContent = status;

            nodeHdr.append(sym, tit, ts, badge);

            const nodeBody = document.createElement('div');
            nodeBody.className = 'node-detail';

            const detailSpan = document.createElement('span');
            detailSpan.textContent = detail;

            const evidenceLine = document.createElement('div');
            evidenceLine.className = 'evidence-line';
            evidenceLine.textContent = evidence;

            nodeBody.append(detailSpan, evidenceLine);
            node.append(nodeHdr, nodeBody);
            panelRight.append(node);
        });

        workbench.append(panelRight);
        body.append(workbench);
        container.appendChild(body);
    }

    // [SEC-04e2] _renderDomainOverview — CRM-VIEWS-01 · 2026-06-04
    // Vista L1: resumen pedagógico + guía de navegación + KYC notice por dominio.
    // DT-AIP-05: todos los datos vienen de DOMAIN_CONTENT (deepFrozen) — innerHTML seguro.
    _renderDomainOverview(container, domainId) {
        const DOMAIN_CONTENT = Object.freeze({
            'ma-real-estate': Object.freeze({
                title:    'M&A & Real Estate',
                icon:     'business_center',
                pedagogy: 'Este dominio agrupa operaciones de compraventa de empresas y activos inmobiliarios dentro de AIP. Cubre mandatos de adquisición, desinversión, estructuración de transacciones y coordinación de debida diligencia. Su usuario natural es el inversor corporativo, patrimonial o institucional que busca ejecutar operaciones con gobernanza, documentación y cierre controlado.',
                nav:      'Encontrará flujos por tipo de operación (M&A, RE comercial, RE premium/residencial) y estado (evaluación, mandato, cierre). Incluye requisitos de información, hitos de proceso y canal de coordinación documental.',
                kyc:      'Antes de iniciar gestiones, AIP verificará identidad, beneficiario final y origen de fondos conforme a AML/KYC; la información se solicita para cumplir obligaciones legales y de debida diligencia.',
                categories: ['Compraventa Empresarial', 'Real Estate Comercial', 'Real Estate Premium / Residencial'],
            }),
            'commodities-trade': Object.freeze({
                title:    'Commodities & Trade Finance',
                icon:     'trending_up',
                pedagogy: 'Este dominio aborda operaciones vinculadas a commodities y a su financiamiento comercial. Cubre originación y ejecución de compra/venta, logística documental, mitigación de riesgo de contraparte y estructuras de trade finance asociadas. Su usuario natural es el inversor, productor o comercializador que requiere control de riesgos, trazabilidad y disciplina de cumplimiento.',
                nav:      'Encontrará rutas por vertical (energía, agrícola, metales/minería) y por tipo de instrumento (spot/forward, prefinanciación, cartas de crédito, garantías). Incluye checklist documental, hitos operativos y estándares de verificación.',
                kyc:      'Por políticas de cumplimiento y prevención de lavado, AIP podrá requerir documentación de contraparte, beneficiario final, actividad económica y trazabilidad de fondos/mercancía antes de avanzar.',
                categories: ['Energía & Derivados', 'Agrícola & Soft', 'Metales & Minería'],
            }),
            'soluciones-financieras': Object.freeze({
                title:    'Soluciones Financieras',
                icon:     'account_balance',
                pedagogy: 'Este dominio reúne estructuras de capital para financiar crecimiento, adquisiciones o reordenamiento financiero. Cubre deuda, equity e instrumentos híbridos, con análisis de riesgo, términos, covenants y coordinación de cierre. Su usuario natural es el inversor profesional o la empresa que necesita una solución alineada a flujo de caja, gobierno corporativo y horizonte.',
                nav:      'Encontrará módulos por tipo de solución (deuda, equity, híbridos) y por etapa (diagnóstico, estructuración, colocación/cierre). Incluye parámetros clave, documentación requerida y ruta de aprobación interna.',
                kyc:      'AIP actúa bajo estándares fiduciarios y de debida diligencia; se solicitará información para validar idoneidad, beneficiario final y origen de fondos antes de presentar o ejecutar estructuras.',
                categories: ['Deuda & Estructurados', 'Equity & Capital', 'Híbridos & Alternativos'],
            }),
            'aip-ventures': Object.freeze({
                title:    'AIP Ventures',
                icon:     'rocket_launch',
                pedagogy: 'Este dominio se orienta a inversiones en empresas de alto crecimiento mediante venture equity, growth capital y estructuras. Cubre evaluación, términos de inversión, gobernanza, derechos económicos y escenarios de salida. Su usuario natural es el inversor sofisticado que acepta mayor incertidumbre a cambio de potencial de retorno, con foco en control de riesgos y transparencia.',
                nav:      'Encontrará oportunidades por etapa (venture/growth) y por tipo de instrumento (equity, convertibles, estructurados). Incluye data room, métricas mínimas, términos preliminares y flujo de aprobación/ejecución.',
                kyc:      'Antes de habilitar acceso a información o procesos, AIP verificará identidad, perfil y origen de fondos; la validación KYC/AML es condición para continuar y protege a todas las partes.',
                categories: ['Venture Equity', 'Growth Capital', 'Estructurados Venture'],
            }),
        });

        const d = DOMAIN_CONTENT[domainId];
        if (!d) {
            container.innerHTML = `<div style="padding:24px;"><p class="label-xs ghost">Dominio desconocido: ${domainId}</p></div>`;
            return;
        }

        container.innerHTML = `
        <!-- Sub-header breadcrumb -->
        <div class="crm-home__subbar">
            <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn-inst" data-action-home="BackToPortfolio" style="padding:4px 12px;font-size:9px;">← VOLVER</button>
                <span class="label-sm ghost">/</span>
                <span class="label-sm ghost">CRM</span>
                <span class="label-sm ghost">/</span>
                <span class="label-sm" style="color:var(--crm-accent);">${d.title}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="badge badge--maturing">NIVEL L1 — DOMINIO</span>
            </div>
        </div>

        <!-- Cuerpo de la vista -->
        <div class="proc-view">

            <!-- Encabezado del dominio -->
            <div style="display:flex;flex-direction:column;gap:8px;">
                <p class="label-xs ghost">RESUMEN DEL DOMINIO</p>
                <h2 style="font-size:16px;font-weight:600;">${d.title}</h2>
                <div class="proc-market-note" style="font-size:12px;line-height:1.7;">${d.pedagogy}</div>
            </div>

            <!-- Guía de navegación -->
            <div style="background:var(--crm-surface);border:1px solid var(--crm-border);padding:16px 20px;">
                <p class="label-xs ghost" style="margin-bottom:10px;">GUÍA DE NAVEGACIÓN</p>
                <p style="font-size:11px;color:var(--crm-text-secondary);line-height:1.6;margin-bottom:16px;">${d.nav}</p>
                <div style="display:flex;flex-direction:column;gap:0;border:1px solid var(--crm-border);">
                    ${d.categories.map(cat => `
                    <div style="padding:10px 14px;border-bottom:1px solid var(--crm-border);display:flex;align-items:center;gap:10px;background:var(--crm-abyss);">
                        <span style="width:4px;height:4px;border-radius:50%;background:var(--crm-accent);flex-shrink:0;"></span>
                        <span style="font-size:11px;">${cat}</span>
                        <span class="badge badge--maturing" style="margin-left:auto;font-size:8px;">PROC</span>
                        <span class="badge badge--blocked" style="font-size:8px;">🔒 OPP</span>
                    </div>`).join('')}
                    <div style="padding:10px 14px;display:flex;align-items:center;gap:10px;background:var(--crm-abyss);">
                        <span style="width:4px;height:4px;border-radius:50%;background:var(--crm-border);flex-shrink:0;"></span>
                        <span style="font-size:10px;color:var(--crm-text-secondary);">Última categoría sin borde</span>
                    </div>
                </div>
            </div>

            <!-- KYC Notice fiduciario -->
            <div class="notice-plate">
                <span class="mono" style="font-size:11px;color:var(--crm-warning);flex-shrink:0;margin-top:1px;">⚠</span>
                <div>
                    <p class="label-xs" style="color:var(--crm-warning);margin-bottom:3px;">VERIFICACIÓN KYC REQUERIDA</p>
                    <p style="font-size:11px;color:var(--crm-text-secondary);line-height:1.5;">${d.kyc}</p>
                </div>
            </div>

        </div>`;
    }

    // [SEC-04f] _wire — event delegation + listeners globales
    _wire() {
        // [CRM-VIEWS-01] Listener dominio L1 — domain overview
        document.addEventListener('Skeleton:Action:DomainFocus', (e) => {
            const { domain } = e.detail;
            if (!domain) { console.warn('[CrmHome] DomainFocus sin domain'); return; }
            this.#selectedDomain   = domain;
            this.#selectedMandate  = null;
            this.#selectedCategory = null;
            this._render();
            this._wireViewInternal();
            console.log(`[CrmHome] DomainFocus → ${domain}`);
        });

        // [DT-AIP-07 Cycle 3] Listener mandato individual (L3)
        document.addEventListener('Skeleton:Action:MandateSelected', (e) => {
            const { mandate } = e.detail;
            if (!mandate) { console.warn('[CrmHome] MandateSelected sin payload'); return; }
            this.#selectedMandate  = mandate;
            this.#selectedCategory = null;
            this.#selectedDomain   = null;
            this._render();
            this._wireViewInternal();
        });

        // [CRM-TREE-03] Listener categoría L2 — procedure o opportunity layer
        document.addEventListener('Skeleton:Action:CategorySelected', (e) => {
            const { categoryId, layer, categoryData } = e.detail;
            if (!categoryId) { console.warn('[CrmHome] CategorySelected sin categoryId'); return; }
            const data = categoryData ?? mockState?.categories?.[categoryId] ?? null;
            if (!data) { console.warn('[CrmHome] CategorySelected: no hay datos para', categoryId); return; }
            this.#selectedMandate  = null;
            this.#selectedCategory = data;
            this.#selectedDomain   = null;
            this.#selectedLayer    = layer ?? 'procedure';
            this._render();
            this._wireViewInternal();
            console.log(`[CrmHome] CategorySelected → ${categoryId} · layer: ${layer}`);
        });

        this._wireViewInternal();
    }

    _wireViewInternal() {
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
                case 'BackToPortfolio':
                    this.#selectedMandate  = null;
                    this.#selectedCategory = null;
                    this.#selectedDomain   = null;
                    this._render();
                    this._wireViewInternal();
                    break;

                case 'OpenTeaser': {
                    // Teaser cliqueado en opportunity-view → abrir mandate-detail-view
                    const mandateId = btn.dataset.mandateId;
                    const mandate = mockState?.mandates?.find(m => m.mandateId === mandateId) ?? null;
                    if (mandate) {
                        this.#selectedMandate = mandate;
                        this._render();
                        this._wireViewInternal();
                    } else {
                        console.warn('[CrmHome] OpenTeaser: mandato no encontrado →', mandateId);
                    }
                    break;
                }

                case 'OpenOutputSimulator': {
                    const categoryId = btn.dataset.categoryId;
                    this._onOpenOutputSimulator(categoryId);
                    break;
                }
            }
        });
    }

    // [SEC-04f2] _onOpenOutputSimulator — dispara Skeleton:Output:ContentSelected
    _onOpenOutputSimulator(categoryId) {
        if (!categoryId) { console.warn('[CrmHome] OpenOutputSimulator: sin categoryId'); return; }
        this._emit('Skeleton:Output:ContentSelected', {
            type:   'procedimiento',
            origin: 'category',
            refId:  categoryId,
        });
    }

    // [SEC-04g] _emit + dispatch — bus canónico + FSM
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

    // [SEC-04h] Helpers de render
    /** SVG ring para IntegrityScore. circunferencia = 2π × r (r=28) ≈ 175.93 */
    _renderScoreRing(score) {
        const r            = 28;
        const circumference = +(2 * Math.PI * r).toFixed(2);
        const offset        = +(circumference * (1 - score / 100)).toFixed(2);
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
                <p style="font-size:9px;color:var(--crm-text-primary);margin-top:2px;">First-touch: ${proj.firstTouch}</p>
            </div>
            <div class="col-desc">
                <p style="font-size:12px;font-weight:500;margin-bottom:2px;">${proj.label}</p>
                <p style="font-size:10px;color:var(--crm-text-primary);">${proj.detail}</p>
            </div>
            <div class="col-valor">
                <span class="mono" style="font-size:11px;">${proj.valor}</span>
            </div>
            <div class="col-estado">
                <span class="badge ${proj.badgeClass}">${proj.estado}</span>
                <p style="font-size:9px;color:var(--crm-text-primary);margin-top:4px;">${proj.estadoStep}</p>
            </div>
            <div class="col-compl">
                <span style="font-size:9px;color:var(--crm-${proj.aml.color});">${proj.aml.status}</span>
                <p style="font-size:9px;color:var(--crm-text-primary);margin-top:2px;">${proj.kyc.status}</p>
            </div>
            <div class="col-date">
                <span class="mono" style="font-size:10px;color:var(--crm-text-primary);">${proj.lastUpdate}</span>
            </div>
        </div>`;
    }

    /** Zona matching engine bloqueada (skeleton ghosteado) */
    _renderMatchingBlocked() {
        return `
        <div class="matching-blocked-zone" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
            ${[0, 1].map(() => `
            <div style="display:flex;align-items:center;gap:16px;">
                <div class="mono skeleton-id" style="font-size:10px;color:var(--crm-text-primary);width:130px;"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                    <div class="skeleton-bar" style="width:60%;"></div>
                    <div class="skeleton-bar" style="width:40%;"></div>
                </div>
                <div class="mono skeleton-number" style="font-size:10px;color:var(--crm-text-primary);"></div>
                <div class="badge" style="border-color:var(--crm-border);color:var(--crm-text-secondary);">CUALIFICADO</div>
            </div>`).join('')}
        </div>`;
    }

    // [SEC-04i] static mount — API pública de montaje
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
document.addEventListener('Skeleton:Legal:Accepted', () => {
    AipCrmHome.mount('#crm-orbit-2');
}, { once: true });

export { AipCrmHome };
export default AipCrmHome;
