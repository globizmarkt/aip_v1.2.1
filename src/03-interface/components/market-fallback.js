// ============================================================
// ARCHIVO  : market-fallback.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-05
// PROPÓSITO: Inyector de tarjetas de noticias estáticas institucionales
//            para el gadget MARKETS/NEWS cuando la API externa falla o
//            la caché está obsoleta. SIN-07 · H-02.
// ============================================================

// ÍNDICE
// [SEC-01] Configuración y constantes
// [SEC-02] Dataset estático (3 tarjetas validadas)
// [SEC-03] MarketFallback — módulo principal
// [SEC-04] Builders DOM (DT-AIP-05 compliant)
// [SEC-05] Exports

// ============================================================
// [SEC-01] Configuración y constantes
// ============================================================

/** ID del contenedor de noticias en el gadget landing/news/code.html */
const CONTAINER_ID    = 'news-card-grid';
const FALLBACK_CLASS  = 'market-fallback--active';

// ============================================================
// [SEC-02] Dataset estático (3 tarjetas validadas)
// Validadas contra INV-CPY-05 (REGULATORIO · COMPLIANCE · MACRO)
// ============================================================

const FALLBACK_ITEMS = Object.freeze([
    {
        id:        'ecb-collateral',
        tagKey:    'markets.fallback.tags.regulatorio',
        titleKey:  'markets.fallback.ecb.title',
        bodyKey:   'markets.fallback.ecb.body',
        sourceKey: 'markets.fallback.ecb.source',
        date:      '2026-05-24',
    },
    {
        id:        'aml-screening',
        tagKey:    'markets.fallback.tags.compliance',
        titleKey:  'markets.fallback.aml.title',
        bodyKey:   'markets.fallback.aml.body',
        sourceKey: 'markets.fallback.aml.source',
        date:      '2026-05-18',
    },
    {
        id:        'nbfi-liquidity',
        tagKey:    'markets.fallback.tags.macro',
        titleKey:  'markets.fallback.nbfi.title',
        bodyKey:   'markets.fallback.nbfi.body',
        sourceKey: 'markets.fallback.nbfi.source',
        date:      '2026-05-10',
    },
]);

// ============================================================
// [SEC-03] MarketFallback — módulo principal
// ============================================================

export const MarketFallback = {

    /**
     * Activa el fallback: inyecta 3 tarjetas estáticas en #news-card-grid.
     * Llamar cuando la API falla o la caché supera TTL sin refresco.
     *
     * Ejemplo de trigger en NewsCache o inicialización del gadget:
     *   if (apiStatus === 'ERROR' || staleness > MARKET_FALLBACK_THRESHOLD_MS) {
     *     MarketFallback.init();
     *   }
     */
    init() {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) {
            console.warn('[MarketFallback] Contenedor #' + CONTAINER_ID + ' no encontrado.');
            return;
        }

        container.classList.add(FALLBACK_CLASS);
        container.replaceChildren(); // DT-AIP-05: cero innerHTML

        const header = _buildHeader();
        container.appendChild(header);

        FALLBACK_ITEMS.forEach(item => {
            container.appendChild(_buildCard(item));
        });

        console.log('[MarketFallback] Fallback institucional activado (3 tarjetas).');
    },

    /**
     * Desactiva el fallback: purga el contenedor antes de hidratación por API real.
     * Llamar cuando NewsCache recupera datos frescos.
     */
    deactivate() {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) return;
        container.classList.remove(FALLBACK_CLASS);
        container.replaceChildren();
        console.log('[MarketFallback] Fallback desactivado — listo para hidratación API.');
    },
};

// ============================================================
// [SEC-04] Builders DOM (DT-AIP-05 — cero innerHTML)
// ============================================================

function _buildHeader() {
    const div = document.createElement('div');
    div.className = 'fallback-header';
    div.setAttribute('data-i18n', 'markets.fallback.header');
    div.textContent = '—';
    return div;
}

function _buildCard({ id, tagKey, titleKey, bodyKey, sourceKey, date }) {
    const card = document.createElement('article');
    card.className = 'market-fallback-card';
    card.dataset.newsId = id;

    // Meta: tag + fecha
    const meta = document.createElement('div');
    meta.className = 'fallback-meta';

    const tag = document.createElement('span');
    tag.className = 'fallback-tag';
    tag.setAttribute('data-i18n', tagKey);
    tag.textContent = '—';

    const time = document.createElement('time');
    time.className = 'fallback-date';
    time.setAttribute('datetime', date);
    time.textContent = date;

    meta.append(tag, time);

    // Título
    const title = document.createElement('h4');
    title.className = 'fallback-title';
    title.setAttribute('data-i18n', titleKey);
    title.textContent = '—';

    // Cuerpo
    const body = document.createElement('p');
    body.className = 'fallback-body';
    body.setAttribute('data-i18n', bodyKey);
    body.textContent = '—';

    // Fuente
    const source = document.createElement('span');
    source.className = 'fallback-source';
    source.setAttribute('data-i18n', sourceKey);
    source.textContent = '—';

    card.append(meta, title, body, source);
    return card;
}

// ============================================================
// [SEC-05] Exports
// ============================================================

export default MarketFallback;
