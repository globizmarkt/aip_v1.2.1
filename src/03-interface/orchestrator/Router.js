// %[CARRIL-AIP-ORCHESTRATOR] - [VIBE-AIP-S-REBORN-02]
/**
 * Router.js
 * Orquestador del Bus de Eventos Fiduciario.
 * Traduce el evento genérico Skeleton:RequestGate en eventos canónicos Skeleton:Action:*
 * esperados por los manejadores de vertical (ej. AIPHandler).
 *
 * Doctrina: R20 (Event-Driven) | R28 (Desacoplamiento) | R18 (ES Modules)
 *
 * MAPA DE TRADUCCIÓN:
 *   - Acciones sin entrada en SEMANTIC_MAP → Skeleton:Action:{action} (passthrough genérico)
 *   - Acciones con entrada → traducción semántica explícita
 */

/**
 * Mapa semántico explícito.
 * Solo se registran acciones cuyo data-action difiere del nombre del evento canónico destino.
 */
const SEMANTIC_MAP = Object.freeze({
    CancelAccess:        'Skeleton:Action:GateClosed',
    RequestAccess:       'Skeleton:Action:AuthToggle',
    // [TAB-INJ-01] Navegación de tabs — traducción semántica canónica
    TabAboutAipClick:    'Skeleton:Action:TabNavigate',
    TabOurServicesClick: 'Skeleton:Action:TabNavigate',
    TabMarketsClick:     'Skeleton:Action:TabNavigate',
    TabIntelligenceClick:'Skeleton:Action:TabNavigate',
    TabRegulatoryClick:  'Skeleton:Action:TabNavigate',
    // [E3-T02] Selector de idioma — traducción semántica canónica
    ChangeLanguage:      'Skeleton:Action:LanguageChange',
});

export const Router = {

    /**
     * Activa la escucha del bus. Invocar una sola vez tras Skeleton:SystemReady.
     */
    init() {
        document.addEventListener('Skeleton:RequestGate', (e) => this._route(e));
        console.log('[Router] Bus de enrutamiento activo — mapa de acciones canónico cargado.');
    },

    /**
     * Traduce Skeleton:RequestGate → Skeleton:Action:{Canónico}
     * @param {CustomEvent} e
     */
    _route(e) {
        const { action, ...payload } = e.detail ?? {};

        if (!action) {
            console.warn('[Router] Skeleton:RequestGate recibido sin campo action — ignorado.', e.detail);
            return;
        }

        // Traducción determinista: mapa semántico → fallback genérico (R20)
        const eventName = SEMANTIC_MAP[action] ?? `Skeleton:Action:${action}`;

        document.dispatchEvent(new CustomEvent(eventName, {
            detail: Object.freeze(payload),
            bubbles: true,
        }));

        console.log(`[Router] ${action} → ${eventName}`);
    }
};

export default Router;
