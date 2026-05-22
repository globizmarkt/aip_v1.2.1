// %[CARRIL-AIP-INTERFACE] - [Fase 18.7]
/**
 * AIPHandler.js
 * Orquestador de interacción específico para la Vertical AIP.
 * Re-acoplamiento del Sistema Nervioso (Listeners + DOM Sync).
 */

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
     * Renderiza la matriz de activos en la Órbita 2.
     * TODO [DT-AIP-05]: innerHTML sin sanitización — pendiente sutura Bulldozer.
     */
    populateCRMTable(assets) {
        const container = document.getElementById('crm-table-body');
        if (!container) return;

        container.innerHTML = ''; // Limpieza fiduciaria

        assets.forEach(asset => {
            const row = document.createElement('div');
            row.className = 'crm-luxury-row md:grid grid-cols-[120px_1fr_140px_120px_140px] gap-4 px-6 py-5 mb-4 cursor-pointer group';
            row.dataset.assetId = asset.id;

            row.innerHTML = `
                <span class="text-[10px] font-mono text-secondary tracking-widest self-center">${asset.id}</span>
                <div class="flex flex-col">
                    <span class="text-sm text-white font-medium tracking-wide">${asset.type}</span>
                    <span class="text-[9px] text-white/40 uppercase tracking-tighter">${asset.jurisdiction} · ${this._t('crm.row.grade')}</span>
                </div>
                <div class="flex items-center justify-center">
                    <span class="px-3 py-1 text-[8px] uppercase tracking-widest border border-secondary/20 bg-secondary/5 text-secondary rounded-full">${asset.status}</span>
                </div>
                <div class="flex items-center justify-center">
                    <span class="text-[10px] font-mono ${asset.score > 70 ? 'text-success' : 'text-warning'}">${asset.kyc} ${this._t('crm.row.verified')}</span>
                </div>
                <div class="flex items-center justify-end">
                    <button class="text-xs text-white/20 group-hover:text-secondary transition-colors">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            `;

            container.appendChild(row);
        });
    },

    /**
     * Lógica de filtrado (stub para expansión)
     */
    filterCRM(filter) {
        console.log(`[AIPHandler] Filtrando CRM por: ${filter}`);
        // Aquí iría la lógica de ocultar/mostrar filas
    }
};

export default AIPHandler;
