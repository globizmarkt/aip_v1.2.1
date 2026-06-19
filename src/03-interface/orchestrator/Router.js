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
    // [LAND-05/06/07/08] Slugs canónicos post-DEC-LAND-01 — 2026-05-30
    NavInicio:           'Skeleton:Action:TabNavigate',  // __main__ → restaura orbit-2-main-content
    TabAboutUsClick:     'Skeleton:Action:TabNavigate',  // about-us/ (fusión about-aip + our-services)
    TabMarketsClick:     'Skeleton:Action:TabNavigate',  // → news/ (slug canónico)
    TabIntelligenceClick:'Skeleton:Action:TabNavigate',  // → opportunity/ (slug canónico)
    TabRegulatoryClick:  'Skeleton:Action:TabNavigate',
    TabAipVenturesClick: 'Skeleton:Action:TabNavigate',  // [LAND-01] Tab #6 — AIP Ventures
    // [B5-H1] CTAs inyectados en tab opportunity/intelligence — VR-REBORN-08
    OrbitTransitionAdmission: 'Skeleton:Action:GateWake', // abre Orbit-3 en modo registro
    // [E3-T02] Selector de idioma — traducción semántica canónica
    ChangeLanguage:      'Skeleton:Action:LanguageChange',
});

export const Router = {

    /**
     * Activa la escucha del bus. Invocar una sola vez tras Skeleton:SystemReady.
     */
    init() {
        document.addEventListener('Skeleton:RequestGate', (e) => this._route(e));
        console.log('[Router] Bus de enrutamiento activo — mapa de acciones canónico cargado (post-DEC-LAND-01).');
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
