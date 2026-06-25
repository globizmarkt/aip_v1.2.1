// ============================================================================
// crm-welcome.js
// CRM Welcome Gate — Orientación post-login por perfil
// ============================================================================
// ÉPICA    : E6 — AIP Lights On
// TICKET   : CRM-WP-01
// AGENTE   : Claude Code (Sentinel)
// DOCTRINA : R3 (Zero-Hex) · R4 (i18n) · R7 (Zero-Inline) · R11 (Event-Driven)
//            DT-AIP-05 (createElement — cero innerHTML) · R-GADGET-01
// SESIÓN   : VIBE-AIP-S-REBORN-03.6 · 2026-06-05
// SKELETON : Candidato a elevación — patrón reutilizable en cualquier vertical
//            con trinity layout. Ver: skeleton-core/patrones/CRM_WELCOME_GATE.md
// ============================================================================
//
// PROPÓSITO
//   Primera pantalla al entrar en el CRM (post-Attestation, pre-Dashboard).
//   Explica al usuario dónde ha llegado y lo orienta hacia la pestaña correcta
//   de Órbita-1 según su perfil (inversor / agente / ba / fundador).
//
// TRIGGER DE INYECCIÓN
//   Vincular a Skeleton:Legal:Accepted en main.js, tras ocultar
//   #legal-attestation-gate y antes de renderizar #crm-dashboard.
//   Uso: CRMWelcomeGate.init('welcome-gate-placeholder', profile)
//
// RESOLUCIÓN DE PERFIL
//   CRMWelcomeGate.init('welcome-gate-placeholder',
//     window.Skeleton?.PassportEngine?.role ?? 'inversor')
//
// PERFILES SOPORTADOS
//   inversor · agente · ba · fundador
//   Fallback automático a 'inversor' si perfil desconocido.
//
// DICCIONARIOS i18n REQUERIDOS
//   src/locales/es/ui.json → claves welcome.*
//   src/locales/en/ui.json → claves welcome.*
//   (ver abajo — DICCIONARIO CANÓNICO)
// ============================================================================
//
// DICCIONARIO CANÓNICO — inyectar en locales/{lang}/ui.json
// ─────────────────────────────────────────────────────────────────────────────
// ES:
//   welcome.investor.title : "Bienvenida Institucional"
//   welcome.investor.body  : "Acceso validado. Clearance: {clearance}. Sus mandatos
//                             cualificados y alertas de mercado residen en el árbol
//                             de Portfolio. Inicie la revisión de expedientes desde
//                             la navegación maestra."
//   welcome.investor.cta   : "Navegar a Portfolio"
//
//   welcome.agent.title    : "Registro de Agente"
//   welcome.agent.body     : "Esclusa fiduciaria completada. Trazas de contraparte
//                             y expedientes de originación indexados en Operaciones.
//                             Consulte el log de cumplimiento para hitos pendientes."
//   welcome.agent.cta      : "Navegar a Operaciones"
//
//   welcome.ba.title       : "Canal Inversor Cualificado"
//   welcome.ba.body        : "Autorización BA activa. Acceso directo a mandatos
//                             embrionarios y salas de datos estructuradas. La
//                             asignación de capital se gestiona desde Mandatos."
//   welcome.ba.cta         : "Navegar a Mandatos"
//
//   welcome.founder.title  : "Perfil de Originador"
//   welcome.founder.body   : "Presentación recibida y sellada. Su estructura opera
//                             en fase de gestación. Documentación técnica y NCNDA
//                             centralizados en Presentaciones. Complete KYC de
//                             equipo para activar matching."
//   welcome.founder.cta    : "Navegar a Presentaciones"
//
// EN:
//   welcome.investor.title : "Institutional Access Confirmed"
//   welcome.investor.body  : "Access validated. Clearance: {clearance}. Your
//                             qualified mandates and market alerts are in the
//                             Portfolio tree. Begin file review from the master
//                             navigation."
//   welcome.investor.cta   : "Go to Portfolio"
//
//   welcome.agent.title    : "Agent Registry Active"
//   welcome.agent.body     : "Fiduciary lock cleared. Counterparty traces and
//                             origination files indexed under Operations. Review
//                             the compliance log for pending milestones."
//   welcome.agent.cta      : "Go to Operations"
//
//   welcome.ba.title       : "Qualified Investor Channel"
//   welcome.ba.body        : "BA authorisation active. Direct access to embryonic
//                             mandates and structured data rooms. Capital allocation
//                             managed from the Mandates view."
//   welcome.ba.cta         : "Go to Mandates"
//
//   welcome.founder.title  : "Originator Profile"
//   welcome.founder.body   : "Submission received and sealed. Your structure is in
//                             gestation phase. Technical documentation and NCNDA
//                             centralised under Submissions. Complete team KYC to
//                             activate matching."
//   welcome.founder.cta    : "Go to Submissions"
// ─────────────────────────────────────────────────────────────────────────────

// ============================================================
// [SEC-01] Configuración por perfil
// ============================================================

const PROFILE_CFG = Object.freeze({
    inversor: {
        title: 'welcome.investor.title',
        body:  'welcome.investor.body',
        cta:   'welcome.investor.cta',
        tab:   'portfolio',
        icon:  'shield_lock',
    },
    agente: {
        title: 'welcome.agent.title',
        body:  'welcome.agent.body',
        cta:   'welcome.agent.cta',
        tab:   'operations',
        icon:  'handshake',
    },
    ba: {
        title: 'welcome.ba.title',
        body:  'welcome.ba.body',
        cta:   'welcome.ba.cta',
        tab:   'mandates',
        icon:  'account_balance',
    },
    fundador: {
        title: 'welcome.founder.title',
        body:  'welcome.founder.body',
        cta:   'welcome.founder.cta',
        tab:   'submissions',
        icon:  'rocket_launch',
    },
});

// ============================================================
// [SEC-02] CRMWelcomeGate — módulo principal
// ============================================================

export const CRMWelcomeGate = {

    /**
     * Inicializa la Welcome Gate en el contenedor indicado.
     * @param {string} containerId - ID del elemento host en el DOM
     * @param {string} profile     - 'inversor' | 'agente' | 'ba' | 'fundador'
     */
    init(containerId, profile = 'inversor') {
        const cfg  = PROFILE_CFG[profile] ?? PROFILE_CFG.inversor;
        const host = document.getElementById(containerId);
        if (!host) {
            console.warn('[CRMWelcomeGate] Contenedor no encontrado:', containerId);
            return;
        }

        host.replaceChildren(); // DT-AIP-05: purge sin innerHTML

        const section = this._buildSection(cfg, profile);
        host.appendChild(section);

        // Re-trigger UIHydrator para hidratar los data-i18n del Gate recién montado.
        // WelcomeGate monta después de Skeleton:DictionaryReady → UIHydrator no los ve en el sweep inicial.
        document.dispatchEvent(new CustomEvent('Skeleton:DOM:Injected', { bubbles: true }));

        console.log(`[CRMWelcomeGate] Perfil "${profile}" montado en #${containerId}`);
    },

    // ─── Builders ──────────────────────────────────────────────────────────

    _buildSection(cfg, profile) {
        const section = document.createElement('section');
        section.className = 'crm-welcome';
        section.dataset.profile = profile;

        section.append(
            this._buildHeader(cfg),
            this._buildCTA(cfg),
        );
        return section;
    },

    _buildHeader(cfg) {
        const header = document.createElement('header');
        header.className = 'crm-welcome__header';

        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined crm-welcome__icon';
        icon.textContent = cfg.icon;

        const wrap = document.createElement('div');
        wrap.className = 'crm-welcome__text';

        const h1 = document.createElement('h1');
        h1.className = 'crm-welcome__title';
        h1.setAttribute('data-i18n', cfg.title);
        h1.textContent = '';

        const p = document.createElement('p');
        p.className = 'crm-welcome__body';
        p.setAttribute('data-i18n', cfg.body);
        p.textContent = '';

        wrap.append(h1, p);
        header.append(icon, wrap);
        return header;
    },

    _buildCTA(cfg) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'crm-btn crm-btn--primary crm-welcome__cta';
        btn.dataset.action = 'WelcomeNavigate';
        btn.dataset.tab = cfg.tab;

        const txt = document.createElement('span');
        txt.setAttribute('data-i18n', cfg.cta);
        txt.textContent = '';

        const ico = document.createElement('span');
        ico.className = 'material-symbols-outlined';
        ico.textContent = 'arrow_forward';

        btn.append(txt, ico);

        // R11: Event-driven — UIBinder recoge data-action="WelcomeNavigate"
        // o escucha directa como fallback
        btn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:Action:OrbitTab', {
                detail: { tab: cfg.tab },
                bubbles: true,
            }));
        });

        return btn;
    },

    /**
     * Desmonta la Welcome Gate (llamar antes de mostrar el dashboard real).
     * @param {string} containerId
     */
    destroy(containerId) {
        const host = document.getElementById(containerId);
        if (host) host.replaceChildren();
    },
};

export default CRMWelcomeGate;
