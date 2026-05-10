/**
 * AIP FINANCIAL & COMMODITIES — SISTEMA NERVIOSO CORE
 * DIRECTIVA 2: EL ORQUESTADOR DE ESCENAS (SCENE-MANAGER)
 * DOCTRINA R20 (Event-Driven) / R8 (Geometría Trinity)
 */

export const SceneManager = {
    views: {
        MARKET: 'scene_market',
        NEWS: 'scene_news',
        GATE_ONBOARDING: 'scene_gate_onboarding',
        GATE_CLEARANCE: 'scene_gate_clearance',
        WORKSPACE: 'scene_workspace',
        CRM_MOCK_VIEW: 'scene_crm_mock'
    },
    
    state: {
        kyc_level: 1, // 1: Public, 2: Onboarded, 3: Verified VIP
        currentExpediente: null
    },

    currentView: null,

    aimon_messages: {
        WELCOME: 'gatekeeper.aimon.welcome',
        FORM: 'gatekeeper.aimon.fallback',
        INTENT: 'gatekeeper.aimon.intent',
        VIP: 'gatekeeper.aimon.fallback',
        ELEVATION: 'gatekeeper.aimon.elevation.queued'
    },

    init() {
        this.currentView = this.views.MARKET;
        
        // Listeners de navegación básica
        document.addEventListener('Skeleton:TabMarketClick', () => this.switchScene(this.views.MARKET));
        document.addEventListener('Skeleton:TabNewsClick', () => this.switchScene(this.views.NEWS));
        document.addEventListener('Skeleton:TabLegislationClick', () => this.switchScene(this.views.MARKET));

        // CONTRATO ÓRBITA 3 (Sutura Master Architect)
        document.addEventListener('Skeleton:HeaderAccessCTA', () => this.requestGate('onboarding'));
        document.addEventListener('Skeleton:HeroOnboardingTrigger', () => this.requestGate('onboarding'));
        document.addEventListener('Skeleton:GateClosed', () => this.collapseOrbit3());
        document.addEventListener('Skeleton:AuthSuccess', (e) => this.handleAuthSuccess(e.detail));
        document.addEventListener('Skeleton:GateStateChange', (e) => this.updateAimon(e.detail.state));
        document.addEventListener('Skeleton:InquiryElevated', (e) => this.handleInquiryElevation(e.detail));
        document.addEventListener('Skeleton:RequestDocument', (e) => this.requestDocumentAccess(e.detail));
        document.addEventListener('Skeleton:MockProjectSelect', (e) => this.selectProject(e.detail.projectId));
        
        // FASE 15.6 — Dualidad Órbita 3
        document.addEventListener('Skeleton:OAuthSuccess', () => this.handleAuthSuccess({}));
        document.addEventListener('Skeleton:AuthSubmit', () => {
            window.sendTelegramAlert('[AIMON-KYC] 📝 Formulario de onboarding enviado. Esperando validación fiduciaria...');
            this.handleAuthSuccess({});
        });
        document.addEventListener('Skeleton:GateWake', () => {
            window.sendTelegramAlert('[AIMON-GATE] 🔐 Intento de acceso detectado. Gatekeeper en Órbita 3 activado.');
            this.updateAimon('FORM');
        });
        document.addEventListener('Skeleton:GateIdle', () => this.updateAimon('WELCOME'));
        
        // FASE 17.4 — Detección de Arquetipos
        document.addEventListener('Skeleton:ArchetypeDetected', (e) => this.handleArchetypeDetected(e.detail));
        
        console.log('[SceneManager] Orquestador de Órbitas activo y escuchando bus Skeleton.');
        return this;
    },

    switchScene(viewId) {
        if (this.currentView === viewId) return;

        console.log(`[SceneManager] Transición solicitada hacia: ${viewId}`);
        this.currentView = viewId;

        document.dispatchEvent(new CustomEvent('Skeleton:SceneChanged', {
            bubbles: true,
            detail: { view: viewId }
        }));
    },

    requestGate(state = 'onboarding') {
        console.log(`[SceneManager] Solicitando acceso a Gatekeeper: ${state}`);
        document.dispatchEvent(new CustomEvent('Skeleton:Orbit3Wake', {
            bubbles: true,
            detail: { state }
        }));
        this.updateAimon(state.toUpperCase());
        this.switchScene(this.views.GATE_ONBOARDING);
    },

    collapseOrbit3() {
        console.log('[SceneManager] Colapsando Órbita 3 (Aduana)');
        this.switchScene(this.views.MARKET);
    },

    handleAuthSuccess(detail = {}) {
        console.log('[SceneManager] Autenticación exitosa (Mock). Elevando KYC a Nivel 2.');
        this.state.kyc_level = 2; // Acceso Onboarded
        
        const prefix = window.APP_PREFIX || 'AIP_LANDING_V0_';
        const locale = sessionStorage.getItem(`${prefix}locale`) || 'en';
        let destination = detail.destination || this.views.CRM_MOCK_VIEW;

        // Lógica de "La Mochila"
        if (destination.includes('.html') || destination.startsWith('http')) {
            const separator = destination.includes('?') ? '&' : '?';
            window.location.href = `${destination}${separator}lang=${locale}`;
            return;
        }

        this.switchScene(destination);
    },

    updateAimon(state) {
        const key = this.aimon_messages[state];
        if (key) {
            console.log(`[SceneManager] AIMON Update: ${state} -> ${key}`);
            document.dispatchEvent(new CustomEvent('Skeleton:AimonUpdate', {
                bubbles: true,
                detail: { i18nKey: key }
            }));
        }
    },

    handleInquiryElevation(payload) {
        const { question, state } = payload;
        console.log(`[SceneManager] Elevando consulta en estado ${state}: "${question}"`);
        
        this.updateAimon('ELEVATION');

        // Simulación de delay de procesamiento humano (1.5s)
        setTimeout(() => {
            console.log('[SceneManager] Consulta elevada con éxito.');
            document.dispatchEvent(new CustomEvent('Skeleton:InquiryConfirmed', {
                bubbles: true,
                detail: { status: 'ELEVATED', timestamp: Date.now() }
            }));
        }, 1500);
    },

    /**
     * LÓGICA DE DRIP ACCESS (Acceso Secuencial)
     * Determina si un documento puede ser visualizado según el nivel de KYC.
     */
    requestDocumentAccess(payload) {
        const { docId, requiredLevel } = payload;
        console.log(`[SceneManager] Solicitud de acceso a documento: ${docId} (Nivel requerido: ${requiredLevel})`);

        if (this.state.kyc_level >= requiredLevel) {
            console.log(`[SceneManager] ACCESO CONCEDIDO: ${docId}`);
            document.dispatchEvent(new CustomEvent('Skeleton:DocumentOpened', {
                bubbles: true,
                detail: { docId, content: 'MOCK_CONTENT_SECURE' }
            }));
        } else {
            console.log(`[SceneManager] ACCESO DENEGADO: Nivel insuficiente. Actual: ${this.state.kyc_level}`);
            this.updateAimon('WELCOME'); // Redirigir a re-KYC o bienvenida informativa
            document.dispatchEvent(new CustomEvent('Skeleton:AccessDenied', {
                bubbles: true,
                detail: { docId, reason: 'KYC_REQUIRED' }
            }));
        }
    },

    /**
     * Selecciona un proyecto del Mock y solicita su visualización.
     */
    selectProject(projectId) {
        console.log(`[SceneManager] Proyecto seleccionado: ${projectId}`);
        const project = window.MOCK_PROJECTS.find(p => p.id_expediente === projectId);
        
        if (project) {
            this.state.currentExpediente = project;
            document.dispatchEvent(new CustomEvent('Skeleton:ProjectDetailUpdate', {
                bubbles: true,
                detail: { project }
            }));
        }
    },

    /**
     * Maneja la detección de un arquetipo y transmuta la Órbita 2.
     * DOCTRINA R29: Enrutamiento Arquetípico Determinístico.
     */
    handleArchetypeDetected(detail) {
        const { archetype, tiebreakerApplied, detectionMethod } = detail;
        console.log(`[SceneManager] Arquetipo Detectado: ${archetype} (Método: ${detectionMethod}, Desempate: ${tiebreakerApplied})`);
        
        window.sendTelegramAlert('[AIMON-ARCHETYPE] 👤 Perfil clasificado exitosamente. Arquetipo detectado: ' + archetype + '. Transmutando interfaz...');

        // Persistir estado de arquetipo en el manager si es necesario
        this.state.archetype = archetype;

        // Disparar evento de transmutación de contenido
        document.dispatchEvent(new CustomEvent('Skeleton:ContentTransmute', {
            bubbles: true,
            detail: { archetype }
        }));

        // Notificar a AIMON si procede (opcional, manteniendo sigilo R29)
        // this.updateAimon('ARCHETYPE_READY');
    }
};

export default SceneManager;
