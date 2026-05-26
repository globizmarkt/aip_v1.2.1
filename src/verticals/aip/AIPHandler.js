// %[CARRIL-AIP-INTERFACE] - [Fase 18.7]
/**
 * AIPHandler.js
 * Orquestador de interacción específico para la Vertical AIP.
 * Re-acoplamiento del Sistema Nervioso (Listeners + DOM Sync).
 */

// [E4-T01] Datos mock CRM — un MANDATE EN590 + 2 stubs locked + ticker
import { mockState } from './mockState.js';

// [DT-018] Validador Fiduciario SDUI — Sentinel (COG-62) · Electrificado VIBE-AIP-S-REBORN-03.4
import { PassportValidator } from '../../01-core/passportValidator.js';

// [FSM-01] Máquina de Estados Finitos del Usuario — VIBE-AIP-S-REBORN-03.5
import { UserFSM } from '../../01-core/userFSM.js';

export const AIPHandler = {

    /**
     * Resuelve una clave i18n vía chasis (COG-66).
     * Fallback: devuelve la key como string visible (COG-11).
     */
    _t(key) {
        return window.Skeleton?.i18n?.t(key) ?? key;
    },

    init() {
        console.log('[AIPHandler] Inicializando handlers de vertical...');
        UserFSM.boot();                     // [FSM-01] Arranque FSM — BOOT_SEQUENCE → ORBIT_1_GUEST|ORBIT_2_GATEKEEPER
        this._setupListeners();
        this._setupCRMControls();
        this._setupAccessForm();
        this._initGatekeeperSubscribers();  // [DT-018] SDUI — Electrificado VIBE-AIP-S-REBORN-03.4
        return this;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // [DT-018] SDUI — Suscriptores del Gatekeeper (Sentinel · COG-62)
    // Escucha los veredictos de PassportValidator y enruta al CRM o al banner de denegación.
    // ─────────────────────────────────────────────────────────────────────────
    _initGatekeeperSubscribers() {
        document.addEventListener('Skeleton:Gatekeeper:AccessGranted', (e) => {
            const { wc, raw } = e.detail;
            // [FSM-01] Transición ORBIT_2_GATEKEEPER → ORBIT_3_CRM_ACTIVE
            UserFSM.transition('Skeleton:Gatekeeper:AccessGranted', { wc });
            this.showCRM(wc);
        });
        document.addEventListener('Skeleton:Gatekeeper:AccessDenied', (e) => {
            const { reason, raw } = e.detail;
            // [FSM-01] Transición ORBIT_2_GATEKEEPER → ACCESS_BLOCKED
            UserFSM.transition('Skeleton:Gatekeeper:AccessDenied', { reason });
            this._showAccessDenied(reason);
        });
    },

    _setupListeners() {
        // --- SENSORES DE ACCIÓN (Vía UIBinder dispatch) ---

        // Despertar Gatekeeper (Lateral)
        document.addEventListener('Skeleton:Action:GateWake', () => {
            this.toggleOrbit3(true);
            this._switchOrbit3Tab('acceso');
        });

        // Cerrar/Colapsar Gatekeeper
        document.addEventListener('Skeleton:Action:GateClosed', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:GateIdle', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:toggleOrbit3', () => this.toggleOrbit3());

        // Alternar Formulario vs Idle en Órbita 3
        document.addEventListener('Skeleton:Action:AuthToggle', () => this.switchGateMode('gatekeeper'));

        // Éxito en Autenticación (Paso al CRM) — [DT-018] vía PassportValidator (mock payload)
        document.addEventListener('Skeleton:Action:OAuthSuccess', () => {
            // [FSM-01] Transición ORBIT_1_GUEST → ORBIT_2_GATEKEEPER antes de lanzar validación
            UserFSM.transition('LOGIN_SUBMITTED');
            const mockPayload = { usr: 'uuid_8f92a', rol: 'inv', tier: 'inst', jur: 'CH', kyc: 'ok', pv: 1, wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'] };
            PassportValidator.validateAccess(mockPayload);
        });

        // [GADGET_0.3] Botón INICIO → scroll a tope de Órbita 2
        document.addEventListener('Skeleton:Action:NavInicio', () => {
            document.getElementById('orbit-2')?.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // [GADGET_0.3 / FASE 3] Cambio de pestaña SISTEMA / AIMON / ACCESO en Órbita 3
        document.addEventListener('Skeleton:Action:OrbitTab', (e) => this._switchOrbit3Tab(e.detail.tab));

        // Filtrado de CRM
        document.addEventListener('Skeleton:Action:CRMFilter', (e) => this.filterCRM(e.detail.filter));

        // --- HIDRATACIÓN DINÁMICA ---
        document.addEventListener('Skeleton:HydrateVertical', (e) => {
            if (e.detail.vertical === 'aip') {
                this.hydrate(e.detail.data);
            }
        });

        // ── [E4-T01 / E4-T02] Boot CRM con mockState al aceptar legal ────────
        // Una sola vez: legal aceptado → CRM visible → poblar tabla + ticker
        document.addEventListener('Skeleton:Legal:Accepted', () => {
            // Breve delay para que el DOM del CRM sea visible antes de pintar
            setTimeout(() => {
                this.populateCRMTable(mockState.mandates);
                this._populateTicker(mockState.ticker);
                console.log('[AIPHandler] CRM inicializado con mockState.');
            }, 100);
        }, { once: true });

        // ── [E4-T02] Selección de mandato → expediente ────────────────────────
        document.addEventListener('Skeleton:Action:MandateSelect', (e) => {
            this._showMandateDetail(e.detail.mandate);
        });
    },

    /**
     * Activa o desactiva la visibilidad de la Órbita 3.
     */
    toggleOrbit3(forceShow = null) {
        const orbit3 = document.getElementById('orbit-3');
        const handoff = document.getElementById('handoff-container');

        if (!orbit3) return;

        const isCurrentlyActive = orbit3.classList.contains('active');
        const shouldShow = (forceShow !== null) ? forceShow : !isCurrentlyActive;

        if (shouldShow) {
            orbit3.classList.add('active');
            // Retraso fiduciario para el fade-in del contenido (v1.2 feel)
            setTimeout(() => {
                if (handoff) {
                    handoff.classList.remove('opacity-0', 'pointer-events-none');
                    handoff.classList.add('opacity-100');
                }
            }, 300);
        } else {
            if (handoff) {
                handoff.classList.add('opacity-0', 'pointer-events-none');
                handoff.classList.remove('opacity-100');
            }
            orbit3.classList.remove('active');
        }
    },

    /**
     * [GADGET_0.3] Alterna entre las 3 pestañas de Órbita 3: SISTEMA, AIMON, ACCESO.
     * Sincroniza mode-dial buttons y rail icons.
     */
    _switchOrbit3Tab(tab) {
        const tabs = {
            sistema : document.getElementById('orbit3-tab-sistema'),
            aimon   : document.getElementById('orbit3-tab-aimon'),
            acceso  : document.getElementById('orbit3-tab-acceso'),
        };
        const buttons  = document.querySelectorAll('.mode-dial__option');
        const railBtns = document.querySelectorAll('[data-rail-tab]');

        Object.entries(tabs).forEach(([key, el]) => {
            if (!el) return;
            if (key === tab) el.classList.remove('hidden');
            else             el.classList.add('hidden');
        });

        // Sincronizar mode-dial
        buttons.forEach(btn =>
            btn.classList.toggle('mode-dial__option--active', btn.dataset.tab === tab)
        );

        // Sincronizar rail icons
        railBtns.forEach(btn =>
            btn.classList.toggle('rail-node--active', btn.dataset.railTab === tab)
        );
    },

    /**
     * [FASE 3] Transiciona la interfaz de la Landing al Dashboard CRM.
     * APAGÓN ATÓMICO: Oculta TODA la landing. Revela el CRM en viewport completo.
     */
    showCRM(wcWhitelist = []) {
        // [FSM-01] Inmunización: showCRM solo opera si la FSM autorizó ORBIT_3_CRM_ACTIVE
        const currentState = UserFSM.getState();
        if (currentState !== 'ORBIT_3_CRM_ACTIVE') {
            console.error(`[AIPHandler] showCRM abortado: estado inválido ${currentState}. Se requiere ORBIT_3_CRM_ACTIVE.`);
            return;
        }
        console.log('[AIPHandler] APAGÓN ATÓMICO — Transicionando a vista CRM...');

        // 1. Ocultar el header de la landing
        const landingHeader = document.querySelector('body > header');
        if (landingHeader) landingHeader.classList.add('hidden');

        // 2. Ocultar el footer de la landing
        const landingFooter = document.querySelector('body > footer');
        if (landingFooter) landingFooter.classList.add('hidden');

        // 3. Ocultar Órbita 3 de la landing (sidebar lateral)
        const orbit3Landing = document.getElementById('orbit-3');
        if (orbit3Landing) orbit3Landing.classList.add('hidden');

        // 4. Colapsar el grid del chasis a una sola columna (CRM ocupa todo)
        const chassis = document.querySelector('.aip-chassis');
        if (chassis) chassis.style.gridTemplateColumns = '1fr';

        // 5. Ocultar el contenido de la landing en Órbita 2
        const landingContent = document.getElementById('orbit-2-main-content');
        if (landingContent) landingContent.classList.add('hidden');

        // 6. Ocultar el contenedor de inyección de tabs
        const tabContainer = document.getElementById('tab-content-container');
        if (tabContainer) tabContainer.classList.add('hidden');

        // 7. Limpiar padding/margin de Órbita 2 para que el CRM ocupe el viewport
        const orbit2 = document.getElementById('orbit-2');
        if (orbit2) {
            orbit2.className = 'overflow-hidden w-full h-full';
        }

        // 8. Revelar el Dashboard CRM
        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.cssText = 'display:flex;width:100%;height:100%;';
        }

        // 9. Inyectar Barrera KYC Abierta (banner superior persistente)
        this._injectKYCBanner();

        // 10. [DT-018] Inyección SDUI — montar componentes autorizados por wcWhitelist
        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard && Array.isArray(wcWhitelist) && wcWhitelist.length > 0) {
            wcWhitelist.forEach(tagName => {
                const el = document.createElement(tagName);
                el.setAttribute('data-sdui', 'true');
                dashboard.appendChild(el);
            });
        }

        // 11. Emitir el evento legal para que se pueble la tabla CRM
        document.dispatchEvent(new CustomEvent('Skeleton:Legal:Accepted', { bubbles: true }));

        console.log('[AIPHandler] APAGÓN COMPLETADO — CRM en viewport.');
    },

    /**
     * [FASE 4] Inyecta el banner KYC "Barrera Abierta" en el CRM.
     * No es un modal bloqueante — es una franja superior persistente.
     */
    _injectKYCBanner() {
        const dashboard = document.getElementById('crm-dashboard');
        if (!dashboard || document.getElementById('kyc-barrier-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'kyc-barrier-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            display: flex; align-items: center; justify-content: center; gap: 12px;
            padding: 10px 24px;
            background: linear-gradient(135deg, rgba(199, 162, 75, 0.15), rgba(127, 180, 255, 0.08));
            border-bottom: 1px solid rgba(193, 168, 93, 0.3);
            backdrop-filter: blur(12px);
        `;

        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.style.cssText = 'font-size:16px;color:#C7A24B;';
        icon.textContent = 'shield_lock';

        const text = document.createElement('span');
        text.style.cssText = 'font-family:var(--font-mono);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(199,162,75,0.9);';
        text.textContent = 'ACCESO RESTRINGIDO // KYC TIER 2 REQUERIDO — Complete la validación para operar';

        const btn = document.createElement('button');
        btn.style.cssText = `
            margin-left: auto; padding: 4px 16px;
            border: 1px solid rgba(193, 168, 93, 0.4);
            color: #C7A24B; font-size: 9px; font-family: var(--font-mono);
            letter-spacing: 0.15em; text-transform: uppercase;
            background: transparent; cursor: pointer; transition: all 0.3s;
        `;
        btn.textContent = 'VALIDAR KYC';
        btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(193,168,93,0.1)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });

        banner.append(icon, text, btn);
        document.body.prepend(banner);

        // Offset del dashboard para no solaparse con el banner
        dashboard.style.marginTop = '40px';
    },

    // ─────────────────────────────────────────────────────────────────────────
    // [DT-018] Banner de denegación de acceso — suturado R3 Zero-Hex
    // Usa tokens CSS del sistema — cero colores hexadecimales hardcodeados.
    // ─────────────────────────────────────────────────────────────────────────
    _showAccessDenied(reasonCode) {
        const gate = document.getElementById('gatekeeper-panel');
        const idle = document.getElementById('orbit-3-idle');

        if (gate) gate.classList.add('hidden');
        if (idle) idle.classList.remove('hidden');

        const existingBanner = document.getElementById('gate-denied-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('div');
        banner.id = 'gate-denied-banner';
        banner.style.cssText = [
            'margin-top: 24px;',
            'padding: 16px;',
            'border: 1px solid var(--theme-error-border, #ff4d4f);',
            'background: var(--theme-error-bg, rgba(255, 77, 79, 0.1));',
        ].join(' ');

        const title = document.createElement('p');
        title.style.cssText = [
            'font-family: var(--font-mono);',
            'font-size: 10px;',
            'letter-spacing: 0.2em;',
            'text-transform: uppercase;',
            'color: var(--theme-error-text, #ff4d4f);',
            'margin-bottom: 8px;',
        ].join(' ');
        title.textContent = 'ACCESO RESTRINGIDO';

        const detail = document.createElement('p');
        detail.style.cssText = [
            'font-size: 11px;',
            'color: var(--theme-text-secondary, #888);',
            'line-height: 1.5;',
        ].join(' ');

        const reasonMap = Object.freeze({
            'ERR_KYC_FIELD_MISSING':          'Estado KYC no encontrado en credenciales.',
            'ERR_KYC_STATUS_NOT_OK':          'Validación KYC incompleta.',
            'ERR_WC_ARRAY_MISSING':           'Permisos de componentes no definidos.',
            'ERR_WC_ARRAY_EMPTY':             'Permisos de componentes vacíos.',
            'ERR_PAYLOAD_NULL':               'Token de sesión inválido.',
            'ERR_PAYLOAD_INVALID_STRUCTURE':  'Estructura de credenciales corrupta.',
        });
        detail.textContent = reasonMap[reasonCode] ?? 'Bloqueo de seguridad activo.';

        banner.append(title, detail);
        idle?.appendChild(banner);
    },

    /**
     * Alterna entre el estado de Seducción (Idle) y el Formulario (Gatekeeper).
     */
    switchGateMode(mode) {
        const idle = document.getElementById('orbit-3-idle');
        const gate = document.getElementById('gatekeeper-panel');

        if (mode === 'gatekeeper') {
            idle?.classList.add('hidden');
            gate?.classList.remove('hidden');
        } else {
            gate?.classList.add('hidden');
            idle?.classList.remove('hidden');
        }
    },

    /**
     * Hidrata los componentes de la vertical con datos reales.
     */
    hydrate(data) {
        console.log('[AIPHandler] Hidratando Vertical con:', data);

        // 1. Poblar Ticker (Si existe el nodo)
        // DT-AIP-05: data.ticker.* es dato externo en Fase 5+ — textContent (R0)
        const ticker = document.querySelector('.ticker-content');
        if (ticker && data.ticker) {
            ticker.textContent = `XAU/USD ${data.ticker.xau} • SOFR ${data.ticker.sofr} • EUR/CHF ${data.ticker.eur_chf}`;
        }

        // 2. Poblar Tabla CRM
        if (data.assets) {
            this.populateCRMTable(data.assets);
        }
    },

    /**
     * Renderiza la lista de mandatos en Órbita 1 (#crm-table-body).
     *
     * [E4-T02] MandateTree — fuente: mockState.mandates[]
     * [E4-T06] Progressive Lock — mandate.locked === true →
     *           opacity 0.4 · icono lock · click deshabilitado · CTA KYC
     *
     * [DT-AIP-05] ✅ Blindaje anti-XSS: createElement + textContent.
     * Ningún dato externo toca innerHTML.
     *
     * @param {Array} mandates — Array de objetos Mandate (ver mockState.js)
     */
    populateCRMTable(mandates) {
        const container = document.getElementById('crm-table-body');
        if (!container) return;

        container.replaceChildren(); // Limpieza fiduciaria (DT-AIP-05: replaceChildren sobre innerHTML='')

        // Función auxiliar para crear cabeceras de división
        // DT-AIP-05: createElement + textContent — aunque title sea literal, se prohíbe innerHTML
        const createHeader = (title) => {
            const h = document.createElement('div');
            h.className = 'text-[10px] uppercase tracking-widest text-[var(--crm-text-secondary)] mt-4 mb-2 mx-3 font-mono flex items-center gap-1';
            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined';
            icon.style.fontSize = '14px';
            icon.textContent = 'folder_open';
            h.appendChild(icon);
            h.appendChild(document.createTextNode(` ${title}`));
            return h;
        };

        // Función auxiliar para crear sub-nodos bloqueados
        const createLockedNode = (title, state) => {
            const row = document.createElement('div');
            row.className = 'crm-mandate-row px-3 py-2.5 mx-2 my-1 rounded border border-[var(--crm-border)] transition-colors duration-150 select-none opacity-40 cursor-not-allowed';
            row.setAttribute('aria-disabled', 'true');

            const line1 = document.createElement('div');
            line1.className = 'flex items-center justify-between mb-1';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'text-[10px] font-mono text-[var(--crm-text-secondary)] truncate';
            titleSpan.textContent = title;
            
            const lockIcon = document.createElement('span');
            lockIcon.className = 'material-symbols-outlined text-[var(--crm-text-secondary)]';
            lockIcon.style.fontSize = '14px';
            lockIcon.textContent = 'lock';
            
            line1.append(titleSpan, lockIcon);

            const line2 = document.createElement('div');
            line2.className = 'flex items-center justify-between';
            
            const stateBadge = document.createElement('span');
            stateBadge.className = `crm-state-badge crm-state-gestacion`;
            stateBadge.textContent = state;
            
            line2.append(stateBadge);

            const kycCta = document.createElement('div');
            kycCta.className = 'mt-1.5 flex items-center gap-1 text-[8px] uppercase tracking-widest text-[var(--crm-accent)]/50';
            const kycIcon = document.createElement('span');
            kycIcon.className = 'material-symbols-outlined';
            kycIcon.style.fontSize = '10px';
            kycIcon.textContent = 'verified_user';
            const kycLabel = document.createElement('span');
            kycLabel.textContent = 'KYC requerido';
            kycCta.append(kycIcon, kycLabel);

            row.append(line1, line2, kycCta);
            return row;
        };

        // Buscamos nuestro mandato activo EN590
        const activeMandate = mandates.find(m => m.mandateId === 'AIP-2026-001');

        // 1. M&A y REAL ESTATE
        container.appendChild(createHeader('M&A Y REAL ESTATE'));
        container.appendChild(createLockedNode('Cartera de Activos Off-Market', 'GESTACIÓN'));
        container.appendChild(createLockedNode('Mandatos de Adquisición', 'GESTACIÓN'));

        // 2. INTELIGENCIA FINANCIERA
        container.appendChild(createHeader('INTELIGENCIA FINANCIERA'));
        container.appendChild(createLockedNode('Informes de Soberanía', 'GESTACIÓN'));
        container.appendChild(createLockedNode('Análisis de Riesgo Geopolítico', 'GESTACIÓN'));

        // 3. COMMODITIES
        container.appendChild(createHeader('COMMODITIES'));

        if (activeMandate) {
            const row = document.createElement('div');
            row.className = 'crm-mandate-row px-3 py-2.5 mx-2 my-1 rounded border border-[var(--crm-border)] transition-colors duration-150 select-none cursor-pointer hover:bg-[var(--crm-bg-surface)] hover:border-[var(--crm-accent)]/40';
            row.dataset.mandateId = activeMandate.mandateId;

            const line1 = document.createElement('div');
            line1.className = 'flex items-center justify-between mb-1';
            
            const idSpan = document.createElement('span');
            idSpan.className = 'text-[10px] font-mono text-[var(--crm-text-secondary)] tracking-widest';
            idSpan.textContent = activeMandate.mandateId;
            
            const typeBadge = document.createElement('span');
            typeBadge.className = 'text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[var(--crm-accent)]/30 text-[var(--crm-accent)]';
            typeBadge.textContent = activeMandate.type;
            
            line1.append(idSpan, typeBadge);

            const line2 = document.createElement('div');
            line2.className = 'flex items-center justify-between';
            
            const stateBadge = document.createElement('span');
            stateBadge.className = `crm-state-badge crm-state-${this._stateKey(activeMandate.fiduciaryState)}`;
            stateBadge.textContent = activeMandate.fiduciaryState;
            
            const assetSpan = document.createElement('span');
            assetSpan.className = 'text-[9px] text-[var(--crm-text-secondary)] truncate max-w-[85px]';
            assetSpan.textContent = activeMandate.asset?.class ?? '—';
            
            line2.append(stateBadge, assetSpan);
            row.append(line1, line2);

            row.addEventListener('click', () => {
                container.querySelectorAll('.crm-mandate-row').forEach(r => r.classList.remove('crm-mandate-row--active'));
                row.classList.add('crm-mandate-row--active');
                document.dispatchEvent(new CustomEvent('Skeleton:Action:MandateSelect', { detail: { mandate: activeMandate }, bubbles: true }));
                console.log(`[AIPHandler] Mandato seleccionado: ${activeMandate.mandateId}`);
            });

            container.appendChild(row);
        }

        container.appendChild(createLockedNode('Procedimientos Off-Take', 'GESTACIÓN'));
    },

    /**
     * Devuelve la clave de estado fiduciario para mapeo CSS.
     * @param {string} state — GESTACIÓN | EMBRIONARIO | MADURACIÓN | CUALIFICADO | EJECUTADO
     * @returns {string} clave kebab-case para clase CSS
     */
    _stateKey(state) {
        const MAP = {
            'GESTACIÓN':   'gestacion',
            'EMBRIONARIO': 'embrionario',
            'MADURACIÓN':  'maduracion',
            'CUALIFICADO': 'cualificado',
            'EJECUTADO':   'ejecutado',
        };
        return MAP[state] ?? 'gestacion';
    },

    /**
     * [E4-T03] MandateWorkbench — detalle completo del mandato en Órbita 2.
     * Renderiza: TearsheetHeader + KPI Ribbon + Counterparty Matrix + Terms + Audit Trail.
     * DT-AIP-05 ✅ Blindaje anti-XSS: createElement + textContent. Ningún dato externo toca innerHTML.
     * @param {Object} mandate — objeto Mandate de mockState (deepFrozen)
     */
    _showMandateDetail(mandate) {
        const detail     = document.getElementById('expediente-detail');
        const emptyState = document.getElementById('crm-empty-state');

        if (!detail) return;

        detail.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        // Breadcrumb (selectores alineados con index.html)
        const breadcrumb = document.querySelector('#crm-orbit-2 header p[data-i18n="crm.breadcrumb"]');
        const h1         = document.querySelector('#crm-orbit-2 header h1');
        if (breadcrumb) breadcrumb.textContent = `MANDATE REGISTRY / ${mandate.mandateId}`;
        if (h1) h1.textContent = mandate.asset?.spec ?? mandate.asset?.class ?? mandate.type ?? '—';

        // DT-AIP-05: vaciado seguro — nunca innerHTML con datos externos
        detail.textContent = '';

        // ── ROOT ─────────────────────────────────────────────────────────────
        const workbench = document.createElement('div');
        workbench.className = 'workbench';

        // ── TEARSHEET HEADER (col 1 / 3) ─────────────────────────────────────
        const tHeader = document.createElement('div');
        tHeader.className = 'tearsheet-header';

        const identity = document.createElement('div');
        identity.className = 'mandate-identity';

        const mId = document.createElement('span');
        mId.className = 'mandate-id';
        mId.textContent = mandate.mandateId;

        const mName = document.createElement('span');
        mName.className = 'mandate-name';
        mName.textContent = mandate.asset?.spec ?? mandate.asset?.class ?? '—';

        const mStateBadge = document.createElement('span');
        mStateBadge.className = 'status-badge';
        mStateBadge.textContent = mandate.fiduciaryState ?? '—';

        identity.append(mId, mName, mStateBadge);

        // KPI Ribbon
        const kpiRibbon = document.createElement('div');
        kpiRibbon.className = 'kpi-ribbon';

        const amt = mandate.asset?.estimatedValue;
        const kpiData = [
            { label: 'Valor Est.',  value: amt ? `$${(amt / 1_000_000).toFixed(0)}M` : '—', meta: mandate.asset?.currency ?? '' },
            { label: 'Incoterm',    value: mandate.asset?.incoterm ?? '—',                    meta: '' },
            { label: 'Calidad',     value: mandate.asset?.class ?? '—',                       meta: mandate.asset?.quantity ?? '' },
            { label: 'Cert. SGS',   value: mandate.compliance?.sgsCertificate ?? '—',         meta: '' },
            { label: 'SBLC',        value: mandate.compliance?.sblcProvider ?? '—',           meta: '' },
            { label: 'KYC Tier',    value: `Tier ${mandate.compliance?.kycTier ?? '?'}`,      meta: mandate.compliance?.amlClear ? 'AML ✓' : 'AML —' },
        ];

        kpiData.forEach(({ label, value, meta }) => {
            const cell  = document.createElement('div');
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

        // ── PANEL LEFT ────────────────────────────────────────────────────────
        const panelLeft = document.createElement('div');
        panelLeft.className = 'panel-left';

        // Counterparty Matrix
        const cpTitle = document.createElement('p');
        cpTitle.className = 'kpi-label';
        cpTitle.textContent = 'Matriz de Contrapartes';

        const cpGrid = document.createElement('div');
        cpGrid.className = 'counterparty-grid';

        const frozen     = document.createElement('div');
        frozen.className = 'grid-frozen';
        const scrollable = document.createElement('div');
        scrollable.className = 'grid-scrollable';

        // Headers
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
            { text: 'Estado',     cls: 'col-status' },
            { text: 'KYC',        cls: 'col-kyc' },
            { text: 'Docs',       cls: 'col-docs' },
            { text: 'Compromiso', cls: 'col-commit' },
            { text: 'Juris.',     cls: 'col-juris' },
        ].forEach(({ text, cls }) => {
            const col = document.createElement('div');
            col.className = cls;
            col.textContent = text;
            scrollHdr.append(col);
        });

        frozen.append(frozenHdr);
        scrollable.append(scrollHdr);

        // Party rows
        const parties = [];
        if (mandate.parties?.originator)
            parties.push({ role: 'ORG', entity: mandate.parties.originator, kyc: '▓▓▓▓▓', commit: '—', juris: 'UY' });
        if (mandate.parties?.client)
            parties.push({ role: 'CLI', entity: mandate.parties.client,     kyc: '▓▓▓░░', commit: '—', juris: 'ES' });
        if (Array.isArray(mandate.parties?.counterparties)) {
            mandate.parties.counterparties.forEach(cp =>
                parties.push({ role: 'CP', entity: cp, kyc: '▓▓░░░', commit: '—', juris: 'NL' })
            );
        }

        parties.forEach(p => {
            // Frozen row
            const fRow = document.createElement('div');
            fRow.className = 'grid-row';
            const roleCell   = document.createElement('div');
            roleCell.className = 'col-role';
            roleCell.textContent = p.role;
            const entityCell = document.createElement('div');
            entityCell.className = 'col-entity';
            entityCell.textContent = p.entity;
            fRow.append(roleCell, entityCell);
            frozen.append(fRow);

            // Scrollable row
            const sRow = document.createElement('div');
            sRow.className = 'grid-row';

            const dotDiv = document.createElement('div');
            dotDiv.className = 'col-status';
            const dot = document.createElement('span');
            dot.className = 'status-dot';
            dot.style.background = '#00D4AA';
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

        // Mandate Terms summary
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

        // ── PANEL RIGHT — Audit Trail ─────────────────────────────────────────
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
                symbol:    '✓',
                title:     'NDA / NCNDA Firmado',
                timestamp: mandate.timeline?.created ?? '—',
                status:    c.ncndaSigned ? 'VERIFIED' : 'PENDING',
                detail:    `NDA/NCNDA firmado. Estado: ${c.ncndaSigned ? 'Vigente' : 'Pendiente'}.`,
                evidence:  `ncnda_signed=${c.ncndaSigned}`,
            },
            {
                category: 'LEGAL',
                symbol:    '✓',
                title:     'AML / Sanctions Check',
                timestamp: mandate.timeline?.lastActivity ?? '—',
                status:    (c.amlClear && c.sanctionsCheck) ? 'VERIFIED' : 'PENDING',
                detail:    `AML Clear: ${c.amlClear}. Sanctions: ${c.sanctionsCheck}.`,
                evidence:  `aml=${c.amlClear} · sanctions=${c.sanctionsCheck}`,
            },
            {
                category: 'LEGAL',
                symbol:    '⧖',
                title:     `KYC Tier ${c.kycTier} Due Diligence`,
                timestamp: mandate.timeline?.nextMilestone ?? '—',
                status:    'PENDING',
                detail:    `Próximo hito: ${mandate.timeline?.nextMilestone ?? '—'}`,
                evidence:  `kyc_tier=${c.kycTier} · sblc_provider=${c.sblcProvider ?? '—'}`,
            },
            {
                category: 'BLOCKER',
                symbol:    '!',
                title:     'Certificado SGS',
                timestamp: mandate.timeline?.lastActivity ?? '—',
                status:    c.sgsCertificate ? 'VERIFIED' : 'BLOCKER',
                detail:    c.sgsCertificate
                    ? `Certificado emitido: ${c.sgsCertificate}`
                    : 'Pendiente emisión certificado SGS.',
                evidence: c.sgsCertificate ? `sgs=${c.sgsCertificate}` : 'sgs=MISSING',
            },
        ];

        if (Array.isArray(mandate.notes)) {
            mandate.notes.forEach((note, i) => milestones.push({
                category: 'LEGAL',
                symbol:    '›',
                title:     `Nota ${i + 1}`,
                timestamp: mandate.timeline?.lastActivity ?? '—',
                status:    'VERIFIED',
                detail:    note,
                evidence:  `note_index=${i}`,
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
        detail.append(workbench);
    },

    /**
     * [E4-T05] Pinta el ticker de mercado en el footer de Órbita 1.
     * Stub básico — electrificación real en Fase 5+.
     * @param {Object} ticker — { xau, sofr, eur_chf, brent }
     */
    _populateTicker(ticker) {
        // El ticker del footer Orbit 1 aún no tiene nodo DOM asignado (E4-T00.3 stub).
        // Se emitirá via Skeleton:HydrateVertical cuando exista el nodo destino.
        // Por ahora: log de confirmación.
        console.log('[AIPHandler] Ticker data disponible:', ticker);
    },

    /**
     * Lógica de filtrado (stub para expansión)
     */
    filterCRM(filter) {
        console.log(`[AIPHandler] Filtrando CRM por: ${filter}`);
        // Aquí iría la lógica de ocultar/mostrar filas
    },

    // ─────────────────────────────────────────────────────────────────────────
    // [SEC-15] [GADGET_0.3] FORMULARIO DE ACCESO — Órbita 3 / pestaña ACCESO
    // Perfil toggle · Word counter 12–45 · Submit → Skeleton:Action:OAuthSuccess
    // DT-AIP-05 ✅ Ningún valor de formulario se inyecta con innerHTML.
    // ─────────────────────────────────────────────────────────────────────────
    _setupAccessForm() {
        // ── Toggle perfil: Agente → mostrar "Razón Social" ──────────────────
        document.querySelectorAll('input[name="aip-perfil"]').forEach(input => {
            input.addEventListener('change', () => {
                const wrap = document.getElementById('aip-entidad-wrap');
                if (!wrap) return;
                wrap.classList.toggle('hidden', !(input.value === 'agente' && input.checked));
            });
        });

        // ── Word counter (12–45 palabras) ───────────────────────────────────
        const motivos      = document.getElementById('aip-motivos');
        const countDisplay = document.getElementById('aip-motivos-count');
        const errorMsg     = document.getElementById('aip-motivos-error');

        if (motivos && countDisplay) {
            motivos.addEventListener('input', () => {
                const words = motivos.value.trim().split(/\s+/).filter(w => w.length > 0);
                const count = words.length;
                countDisplay.textContent = `Palabras: ${count} / 45`;
                if (count > 45) {
                    countDisplay.style.color = '#FF4757';
                } else if (count >= 12) {
                    countDisplay.style.color = '#00D4AA';
                } else {
                    countDisplay.style.color = '#9AA7B6';
                }
                if (errorMsg) {
                    errorMsg.classList.toggle('hidden', count === 0 || (count >= 12 && count <= 45));
                }
            });
        }

        // ── Submit → validación fiduciaria → APAGÓN ATÓMICO ─────────────────
        const form = document.getElementById('aip-access-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formError  = document.getElementById('aip-form-error');
            const motivosVal = document.getElementById('aip-motivos')?.value.trim() ?? '';
            const wordCount  = motivosVal.split(/\s+/).filter(w => w.length > 0).length;

            if (wordCount < 12 || wordCount > 45) {
                errorMsg?.classList.remove('hidden');
                formError?.classList.remove('hidden');
                return;
            }

            const nombre = document.getElementById('aip-nombre')?.value.trim();
            const razon  = document.getElementById('aip-razon')?.value.trim();
            const email  = document.getElementById('aip-email')?.value.trim();
            const comms  = document.getElementById('aip-check-comms')?.checked;
            const data   = document.getElementById('aip-check-data')?.checked;

            if (!nombre || !razon || !email || !comms || !data) {
                formError?.classList.remove('hidden');
                return;
            }

            formError?.classList.add('hidden');

            // [DT-018] Transición atómica SPA vía PassportValidator (mock payload)
            // Cuando el backend esté activo, sustituir mockPayload por el token real del servidor.
            // [FSM-01] Transición ORBIT_1_GUEST → ORBIT_2_GATEKEEPER antes de lanzar validación
            UserFSM.transition('LOGIN_SUBMITTED');
            const mockPayload = { usr: 'uuid_8f92a', rol: 'inv', tier: 'inst', jur: 'CH', kyc: 'ok', pv: 1, wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'] };
            PassportValidator.validateAccess(mockPayload);
        });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // [E4-T00.1] RETRACTABLE RAIL — Órbitas 1 y 3 colapsables
    // [E4-T00.2] DARK/LIGHT TOGGLE — Dos estados del sistema
    // D1-1 + D1-4b — 2026-05-24
    // ─────────────────────────────────────────────────────────────────────────
    _setupCRMControls() {
        // ── Retractable Rail: Órbita 1 ───────────────────────────────────────
        const orbit1      = document.getElementById('crm-orbit-1');
        const orbit1Btn   = document.getElementById('crm-orbit1-toggle');
        const orbit1Key   = 'crm_orbit1_collapsed';

        if (orbit1 && orbit1Btn) {
            // Restaurar estado persistido
            if (localStorage.getItem(orbit1Key) === 'true') {
                orbit1.classList.add('collapsed');
            }
            orbit1Btn.addEventListener('click', () => {
                orbit1.classList.toggle('collapsed');
                const isCollapsed = orbit1.classList.contains('collapsed');
                localStorage.setItem(orbit1Key, isCollapsed);
                console.log(`[AIPHandler] Órbita 1 ${isCollapsed ? 'colapsada' : 'expandida'}`);
            });
        }

        // ── Retractable Rail: Órbita 3 ───────────────────────────────────────
        const orbit3Panel = document.getElementById('crm-orbit-3-panel');
        const orbit3Btn   = document.getElementById('crm-orbit3-toggle');
        const orbit3Key   = 'crm_orbit3_collapsed';

        if (orbit3Panel && orbit3Btn) {
            // Restaurar estado persistido
            if (localStorage.getItem(orbit3Key) === 'true') {
                orbit3Panel.classList.add('collapsed');
            }
            orbit3Btn.addEventListener('click', () => {
                orbit3Panel.classList.toggle('collapsed');
                const isCollapsed = orbit3Panel.classList.contains('collapsed');
                localStorage.setItem(orbit3Key, isCollapsed);
                console.log(`[AIPHandler] Órbita 3 ${isCollapsed ? 'colapsada' : 'expandida'}`);
            });
        }

        // ── Dark / Light Toggle ───────────────────────────────────────────────
        const themeInput  = document.getElementById('crm-theme-toggle-input');
        const themeLabel  = document.querySelector('.crm-theme-label');
        const themeKey    = 'crm_theme';

        if (themeInput) {
            // Restaurar tema persistido
            const savedTheme = localStorage.getItem(themeKey) || 'dark';
            if (savedTheme === 'light') {
                document.body.classList.add('light-mode');
                themeInput.checked = true;
                if (themeLabel) themeLabel.textContent = 'Light';
            }

            themeInput.addEventListener('change', () => {
                const isLight = themeInput.checked;
                document.body.classList.toggle('light-mode', isLight);
                localStorage.setItem(themeKey, isLight ? 'light' : 'dark');
                if (themeLabel) themeLabel.textContent = isLight ? 'Light' : 'Dark';
                console.log(`[AIPHandler] Tema CRM → ${isLight ? 'Light' : 'Dark'}`);
            });
        }
    }
};

export default AIPHandler;
