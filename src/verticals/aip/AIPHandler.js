// %[CARRIL-AIP-INTERFACE] - [Fase 18.7]
/**
 * AIPHandler.js
 * Orquestador de interacción específico para la Vertical AIP.
 * Re-acoplamiento del Sistema Nervioso (Listeners + DOM Sync)
 * [VIBE-AIP-S-REBORN-03.7] - Refactor Sentinel: Zero-Race Condition & Apagón Legal
 */

import { mockState } from './mockState.js';
import { PassportValidator } from '../../01-core/passportValidator.js';
import { UserFSM } from '../../01-core/userFSM.js';
import '../../gadgets/aip-trinity-layout.js';

export const AIPHandler = {
    _t(key) {
        return window.Skeleton?.i18n?.t(key) ?? key;
    },

    init() {
        console.log('[AIPHandler] Inicializando handlers de vertical...');
        UserFSM.boot();
        this._setupListeners();
        this._setupCRMControls();
        this._setupAccessForm();
        this._initGatekeeperSubscribers();
        return this;
    },

    _initGatekeeperSubscribers() {
        document.addEventListener('Skeleton:Gatekeeper:AccessGranted', (e) => {
            const { wc } = e.detail;
            UserFSM.transition('Skeleton:Gatekeeper:AccessGranted', { wc });
            this._showLegalAttestation(wc);
        });

        document.addEventListener('Skeleton:Gatekeeper:AccessDenied', (e) => {
            const { reason } = e.detail;
            UserFSM.transition('Skeleton:Gatekeeper:AccessDenied', { reason });
            this._showAccessDenied(reason);
        });

        // [Sutura R20 - Sentinel] Única fuente de verdad para el acceso legal. 
        // Combina el cambio de FSM, el apagón visual y la hidratación de datos.
        document.addEventListener('Skeleton:Legal:Accepted', () => {
            document.getElementById('legal-attestation-gate')?.classList.add('hidden');

            UserFSM.transition('Skeleton:Legal:Accepted', { wc: this._wcPending });
            this.showCRM(this._wcPending);
            // [DT-AIP-07] populateCRMTable extirpada — reemplazada por <aip-orbit1-tree>
        }, { once: true });
    },

    _setupListeners() {
        document.addEventListener('Skeleton:Action:GateWake', () => {
            this.toggleOrbit3(true);
            this._switchOrbit3Tab('acceso');
        });

        document.addEventListener('Skeleton:Action:GateClosed', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:GateIdle', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:toggleOrbit3', () => this.toggleOrbit3());

        document.getElementById('btn-attest-enter')?.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:Legal:Accepted', { bubbles: true }));
        });

        document.addEventListener('Skeleton:Action:AuthToggle', () => this.switchGateMode('gatekeeper'));

        document.addEventListener('Skeleton:Action:OAuthSuccess', () => {
            UserFSM.transition('LOGIN_SUBMITTED');
            const mockPayload = { usr: 'uuid_8f92a', rol: 'inv', tier: 'inst', jur: 'CH', kyc: 'ok', pv: 1, wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'] };
            PassportValidator.validateAccess(mockPayload);
        });

        document.addEventListener('Skeleton:Action:NavInicio', () => {
            document.getElementById('orbit-2')?.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.addEventListener('Skeleton:Action:OrbitTab', (e) => this._switchOrbit3Tab(e.detail.tab));
        // [DT-AIP-07] Skeleton:Action:CRMFilter eliminado — filterCRM() nunca existió (dead listener)

        document.addEventListener('Skeleton:HydrateVertical', (e) => {
            if (e.detail.vertical === 'aip') this.hydrate(e.detail.data);
        });

        document.addEventListener('Skeleton:Action:MandateSelected', (e) => {
            this._showMandateDetail(e.detail.mandate);
        });
    },

    toggleOrbit3(forceShow = null) {
        const orbit3 = document.getElementById('orbit-3');
        const handoff = document.getElementById('handoff-container');
        if (!orbit3) return;

        const isCurrentlyActive = orbit3.classList.contains('active');
        const shouldShow = (forceShow !== null) ? forceShow : !isCurrentlyActive;

        if (shouldShow) {
            orbit3.classList.add('active');
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

    _switchOrbit3Tab(tab) {
        const tabs = {
            sistema: document.getElementById('orbit3-tab-sistema'),
            aimon: document.getElementById('orbit3-tab-aimon'),
            acceso: document.getElementById('orbit3-tab-acceso'),
        };
        const buttons = document.querySelectorAll('.mode-dial__option');
        const railBtns = document.querySelectorAll('[data-rail-tab]');

        Object.entries(tabs).forEach(([key, el]) => {
            if (!el) return;
            if (key === tab) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });

        buttons.forEach(btn => btn.classList.toggle('mode-dial__option--active', btn.dataset.tab === tab));
        railBtns.forEach(btn => btn.classList.toggle('rail-node--active', btn.dataset.railTab === tab));
    },

    _showLegalAttestation(wcWhitelist) {
        console.log('[AIPHandler] Aislamiento Inmersivo — Mostrando Peaje Legal (Attestation)...');
        this._wcPending = wcWhitelist;

        // Apagón atómico del entorno público
        const landingHeader = document.querySelector('body > header');
        const landingFooter = document.querySelector('body > footer');
        const orbit3Landing = document.getElementById('orbit-3');
        const landingContent = document.getElementById('orbit-2-main-content');
        const tabContainer = document.getElementById('tab-content-container');

        if (landingHeader) landingHeader.classList.add('hidden');
        if (landingFooter) landingFooter.classList.add('hidden');
        if (orbit3Landing) orbit3Landing.classList.add('hidden');
        if (landingContent) landingContent.classList.add('hidden');
        if (tabContainer) tabContainer.classList.add('hidden');

        document.getElementById('landing-view')?.classList.add('hidden');
        document.getElementById('legal-attestation-gate')?.classList.remove('hidden');
    },

    showCRM(wcWhitelist = []) {
        const currentState = UserFSM.getState();
        if (currentState !== 'ORBIT_3_CRM_ACTIVE') {
            console.error(`[AIPHandler] showCRM abortado: estado inválido ${currentState}. Se requiere ORBIT_3_CRM_ACTIVE.`);
            return;
        }

        const chassis = document.querySelector('.aip-chassis');
        if (chassis) chassis.style.gridTemplateColumns = '1fr';

        const orbit2 = document.getElementById('orbit-2');
        if (orbit2) orbit2.className = 'overflow-hidden w-full h-full';

        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.cssText = 'display:flex;width:100%;height:100%;';
        }

        this._injectKYCBanner();

        // Prevención Inception: Filtramos el web component host
        if (dashboard && Array.isArray(wcWhitelist) && wcWhitelist.length > 0) {
            wcWhitelist.forEach(tagName => {
                if (tagName === 'aip-trinity-layout') return; // Evita inyectar el chasis dentro de sí mismo
                const el = document.createElement(tagName);
                el.setAttribute('data-sdui', 'true');
                dashboard.appendChild(el);
            });
        }
    },

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

        dashboard.style.marginTop = '40px';
    },

    _showAccessDenied(reasonCode) {
        const gate = document.getElementById('gatekeeper-panel');
        const idle = document.getElementById('orbit-3-idle');

        if (gate) gate.classList.add('hidden');
        if (idle) idle.classList.remove('hidden');

        const existingBanner = document.getElementById('gate-denied-banner');
        if (existingBanner) existingBanner.remove();

        const banner = document.createElement('div');
        banner.id = 'gate-denied-banner';
        banner.style.cssText = 'margin-top: 24px; padding: 16px; border: 1px solid var(--theme-error-border, #ff4d4f); background: var(--theme-error-bg, rgba(255, 77, 79, 0.1));';

        const title = document.createElement('p');
        title.style.cssText = 'font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--theme-error-text, #ff4d4f); margin-bottom: 8px;';
        title.textContent = 'ACCESO RESTRINGIDO';

        const detail = document.createElement('p');
        detail.style.cssText = 'font-size: 11px; color: var(--theme-text-secondary, #888); line-height: 1.5;';

        const reasonMap = Object.freeze({
            'ERR_KYC_FIELD_MISSING': 'Estado KYC no encontrado en credenciales.',
            'ERR_KYC_STATUS_NOT_OK': 'Validación KYC incompleta.',
            'ERR_WC_ARRAY_MISSING': 'Permisos de componentes no definidos.',
            'ERR_WC_ARRAY_EMPTY': 'Permisos de componentes vacíos.',
            'ERR_PAYLOAD_NULL': 'Token de sesión inválido.',
            'ERR_PAYLOAD_INVALID_STRUCTURE': 'Estructura de credenciales corrupta.',
        });
        detail.textContent = reasonMap[reasonCode] ?? 'Bloqueo de seguridad activo.';

        banner.append(title, detail);
        idle?.appendChild(banner);
    },

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

    hydrate(data) {
        const ticker = document.querySelector('.ticker-content');
        if (ticker && data.ticker) {
            ticker.textContent = `XAU/USD ${data.ticker.xau} • SOFR ${data.ticker.sofr} • EUR/CHF ${data.ticker.eur_chf}`;
        }
        // [DT-AIP-07] populateCRMTable extirpada — datos de mandatos via aip-orbit1-tree
    },

    // [DT-AIP-07 — 2026-05-31] populateCRMTable() + _stateKey() EXTIRPADAS.
    // Reemplazadas por <aip-orbit1-tree> (src/gadgets/aip-orbit1-tree.js).
    // La taxonomía 3 niveles (Dominio→Categoría→Mandato) vive en el WC reactivo.

    _showMandateDetail(mandate) {
        const detail = document.getElementById('expediente-detail');
        const emptyState = document.getElementById('crm-empty-state');

        if (!detail) return;

        detail.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        const breadcrumb = document.querySelector('#crm-orbit-2 header p[data-i18n="crm.breadcrumb"]');
        const h1 = document.querySelector('#crm-orbit-2 header h1');
        if (breadcrumb) breadcrumb.textContent = `MANDATE REGISTRY / ${mandate.mandateId}`;
        if (h1) h1.textContent = mandate.asset?.spec ?? mandate.asset?.class ?? mandate.type ?? '—';

        detail.textContent = '';

        const workbench = document.createElement('div');
        workbench.className = 'workbench';

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

        const kpiRibbon = document.createElement('div');
        kpiRibbon.className = 'kpi-ribbon';

        const amt = mandate.asset?.estimatedValue;
        const kpiData = [
            { label: 'Valor Est.', value: amt ? `$${(amt / 1_000_000).toFixed(0)}M` : '—', meta: mandate.asset?.currency ?? '' },
            { label: 'Incoterm', value: mandate.asset?.incoterm ?? '—', meta: '' },
            { label: 'Calidad', value: mandate.asset?.class ?? '—', meta: mandate.asset?.quantity ?? '' },
            { label: 'Cert. SGS', value: mandate.compliance?.sgsCertificate ?? '—', meta: '' },
            { label: 'SBLC', value: mandate.compliance?.sblcProvider ?? '—', meta: '' },
            { label: 'KYC Tier', value: `Tier ${mandate.compliance?.kycTier ?? '?'}`, meta: mandate.compliance?.amlClear ? 'AML ✓' : 'AML —' },
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
            { text: 'Estado', cls: 'col-status' },
            { text: 'KYC', cls: 'col-kyc' },
            { text: 'Docs', cls: 'col-docs' },
            { text: 'Compromiso', cls: 'col-commit' },
            { text: 'Juris.', cls: 'col-juris' },
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

        const termsTitle = document.createElement('p');
        termsTitle.className = 'kpi-label';
        termsTitle.style.marginTop = '24px';
        termsTitle.textContent = 'Condiciones del Mandato';

        const termsData = [
            { label: 'Tipo de operación', value: mandate.type ?? '—' },
            { label: 'Activo', value: mandate.asset?.class ?? '—' },
            { label: 'Especificación', value: mandate.asset?.spec ?? '—' },
            { label: 'Volumen', value: mandate.asset?.quantity ?? '—' },
            { label: 'Incoterm', value: mandate.asset?.incoterm ?? '—' },
            { label: 'Creación', value: mandate.timeline?.created ?? '—' },
            { label: 'Cierre objetivo', value: mandate.timeline?.targetClose ?? '—' },
            { label: 'Último contacto', value: mandate.timeline?.lastActivity ?? '—' },
            { label: 'Próximo hito', value: mandate.timeline?.nextMilestone ?? '—' },
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
        detail.append(workbench);
    },

    // [DT-AIP-07 — 2026-05-31] _populateTicker() EXTIRPADA — código muerto (solo console.log).

    _setupAccessForm() {
        document.querySelectorAll('input[name="aip-perfil"]').forEach(input => {
            input.addEventListener('change', () => {
                const wrap = document.getElementById('aip-entidad-wrap');
                if (!wrap) return;
                wrap.classList.toggle('hidden', !(input.value === 'agente' && input.checked));
            });
        });

        const motivos = document.getElementById('aip-motivos');
        const countDisplay = document.getElementById('aip-motivos-count');
        const errorMsg = document.getElementById('aip-motivos-error');

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

        const form = document.getElementById('aip-access-form');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formError = document.getElementById('aip-form-error');
            const motivosVal = document.getElementById('aip-motivos')?.value.trim() ?? '';
            const wordCount = motivosVal.split(/\s+/).filter(w => w.length > 0).length;

            if (wordCount < 12 || wordCount > 45) {
                errorMsg?.classList.remove('hidden');
                formError?.classList.remove('hidden');
                return;
            }

            const nombre = document.getElementById('aip-nombre')?.value.trim();
            const razon = document.getElementById('aip-razon')?.value.trim();
            const email = document.getElementById('aip-email')?.value.trim();
            const comms = document.getElementById('aip-check-comms')?.checked;
            const data = document.getElementById('aip-check-data')?.checked;

            if (!nombre || !razon || !email || !comms || !data) {
                formError?.classList.remove('hidden');
                return;
            }

            formError?.classList.add('hidden');

            UserFSM.transition('LOGIN_SUBMITTED');
            const mockPayload = { usr: 'uuid_8f92a', rol: 'inv', tier: 'inst', jur: 'CH', kyc: 'ok', pv: 1, wc: ['aip-trinity-layout', 'aip-investor-stats', 'aip-asset-explorer'] };
            PassportValidator.validateAccess(mockPayload);
        });
    },

    _setupCRMControls() {
        const orbit1Toggle = document.getElementById('crm-orbit1-toggle');
        const orbit1Panel = document.getElementById('crm-orbit-1');

        if (orbit1Toggle && orbit1Panel) {
            // [Restauración de UX] Usamos la clase 'collapsed' (que no rompe la grid)
            orbit1Toggle.addEventListener('click', () => {
                const isCollapsed = orbit1Panel.classList.toggle('collapsed');
                orbit1Toggle.setAttribute('aria-expanded', !isCollapsed);
                // Ajuste visual del chevron
                const icon = orbit1Toggle.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left';
                }
            });
        }

        const orbit3Toggle = document.getElementById('crm-orbit3-toggle');
        const orbit3Panel = document.getElementById('crm-orbit-3-panel');

        if (orbit3Toggle && orbit3Panel) {
            orbit3Toggle.addEventListener('click', () => {
                const isCollapsed = orbit3Panel.classList.toggle('collapsed');
                orbit3Toggle.setAttribute('aria-expanded', !isCollapsed);
                // Ajuste visual del chevron
                const icon = orbit3Toggle.querySelector('.material-symbols-outlined');
                if (icon) {
                    icon.textContent = isCollapsed ? 'keyboard_double_arrow_left' : 'keyboard_double_arrow_right';
                }
            });
        }

        const themeInput = document.getElementById('crm-theme-toggle-input');
        const themeLabel = document.querySelector('.crm-theme-label');
        const themeKey = 'crm_theme';

        if (themeInput) {
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
            });
        }
    }
};

export default AIPHandler;