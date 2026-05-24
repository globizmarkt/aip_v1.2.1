// %[CARRIL-AIP-INTERFACE] - [Fase 18.7]
/**
 * AIPHandler.js
 * Orquestador de interacción específico para la Vertical AIP.
 * Re-acoplamiento del Sistema Nervioso (Listeners + DOM Sync).
 */

// [E4-T01] Datos mock CRM — un MANDATE EN590 + 2 stubs locked + ticker
import { mockState } from './mockState.js';

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
        this._setupListeners();
        this._setupCRMControls();   // [E4-T00.1] Retractable Rail + [E4-T00.2] Dark/Light toggle
        return this;
    },

    _setupListeners() {
        // --- SENSORES DE ACCIÓN (Vía UIBinder dispatch) ---

        // Despertar Gatekeeper (Lateral)
        document.addEventListener('Skeleton:Action:GateWake', () => this.toggleOrbit3(true));

        // Cerrar/Colapsar Gatekeeper
        document.addEventListener('Skeleton:Action:GateClosed', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:GateIdle', () => this.toggleOrbit3(false));
        document.addEventListener('Skeleton:Action:toggleOrbit3', () => this.toggleOrbit3());

        // Alternar Formulario vs Idle en Órbita 3
        document.addEventListener('Skeleton:Action:AuthToggle', () => this.switchGateMode('gatekeeper'));

        // Éxito en Autenticación (Paso al CRM)
        document.addEventListener('Skeleton:Action:OAuthSuccess', () => this.showCRM());

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
     * Transiciona la interfaz de la Landing al Dashboard CRM.
     */
    showCRM() {
        console.log('[AIPHandler] Transicionando a vista CRM...');

        // 1. Ocultar el panel lateral
        this.toggleOrbit3(false);

        // 2. Ocultar secciones de la landing
        const landingSections = [
            '.hero-container',
            '#archetype-questionnaire',
            '.feed-container',
            '.legislation-container'
        ];

        landingSections.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.classList.add('hidden');
        });

        // 3. Mostrar el Dashboard
        const dashboard = document.getElementById('crm-dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            // Asegurar que el contenedor padre (orbit-2) no tenga padding extra que rompa el dashboard
            const orbit2 = document.getElementById('orbit-2');
            if (orbit2) orbit2.classList.add('p-0');
        }
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
        const ticker = document.querySelector('.ticker-content');
        if (ticker && data.ticker) {
            ticker.innerHTML = `
                XAU/USD ${data.ticker.xau} &nbsp;&bull;&nbsp;
                SOFR ${data.ticker.sofr} &nbsp;&bull;&nbsp;
                EUR/CHF ${data.ticker.eur_chf}
            `;
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

        container.innerHTML = ''; // Limpieza fiduciaria

        mandates.forEach(mandate => {
            const isLocked = mandate.locked === true;

            // ── Fila contenedor ──────────────────────────────────────────────
            const row = document.createElement('div');
            row.className = [
                'crm-mandate-row',
                'px-3 py-2.5 mx-2 my-1 rounded',
                'border border-[var(--crm-border)]',
                'transition-colors duration-150 select-none',
                isLocked
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-[var(--crm-bg-surface)] hover:border-[var(--crm-accent)]/40',
            ].join(' ');
            row.dataset.mandateId = mandate.mandateId;
            if (isLocked) row.setAttribute('aria-disabled', 'true');

            // ── LÍNEA 1: mandateId (izq) + tipo o candado (der) ─────────────
            const line1 = document.createElement('div');
            line1.className = 'flex items-center justify-between mb-1';

            const idSpan = document.createElement('span');
            idSpan.className = 'text-[10px] font-mono text-[var(--crm-text-secondary)] tracking-widest';
            idSpan.textContent = mandate.mandateId;

            if (isLocked) {
                // [E4-T06] Progressive Lock visual — icono candado
                const lockIcon = document.createElement('span');
                lockIcon.className = 'material-symbols-outlined text-[var(--crm-text-secondary)]';
                lockIcon.style.fontSize = '14px';
                lockIcon.textContent = 'lock';
                line1.append(idSpan, lockIcon);
            } else {
                // Badge de tipo (Trade / Advisory / Asset)
                const typeBadge = document.createElement('span');
                typeBadge.className = [
                    'text-[8px] uppercase tracking-widest',
                    'px-1.5 py-0.5 rounded',
                    'border border-[var(--crm-accent)]/30 text-[var(--crm-accent)]',
                ].join(' ');
                typeBadge.textContent = mandate.type;
                line1.append(idSpan, typeBadge);
            }

            // ── LÍNEA 2: estado fiduciario (izq) + clase de activo (der) ────
            const line2 = document.createElement('div');
            line2.className = 'flex items-center justify-between';

            const stateBadge = document.createElement('span');
            stateBadge.className = `crm-state-badge crm-state-${this._stateKey(mandate.fiduciaryState)}`;
            stateBadge.textContent = mandate.fiduciaryState;

            const assetSpan = document.createElement('span');
            assetSpan.className = 'text-[9px] text-[var(--crm-text-secondary)] truncate max-w-[85px]';
            assetSpan.textContent = mandate.asset?.class ?? '—';

            line2.append(stateBadge, assetSpan);

            // ── [E4-T06] CTA KYC en fila bloqueada ──────────────────────────
            if (isLocked) {
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
            } else {
                row.append(line1, line2);
            }

            // ── Click — solo mandatos desbloqueados ──────────────────────────
            if (!isLocked) {
                row.addEventListener('click', () => {
                    // Estado activo: resaltar fila seleccionada
                    container.querySelectorAll('.crm-mandate-row').forEach(r =>
                        r.classList.remove('crm-mandate-row--active')
                    );
                    row.classList.add('crm-mandate-row--active');

                    // [E4-T02] Emisión del evento de selección de mandato
                    document.dispatchEvent(new CustomEvent('Skeleton:Action:MandateSelect', {
                        detail: { mandate },
                        bubbles: true,
                    }));
                    console.log(`[AIPHandler] Mandato seleccionado: ${mandate.mandateId}`);
                });
            }

            container.appendChild(row);
        });
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
