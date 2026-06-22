// ============================================================
// ARCHIVO  : output-export.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-22
// PROPÓSITO: Módulo de exportación — patrón Strategy para PDF/WhatsApp/Telegram
// ============================================================

// ÍNDICE
// [SEC-01] Constantes y helpers
// [SEC-02] Estrategias de exportación
// [SEC-03] Dispatcher principal — export()
// [SEC-04] Formatters de payload
// [SEC-05] Export

// ─── [SEC-01] Constantes y helpers ───────────────────────────────────────────

const WHATSAPP_URL  = 'https://wa.me/';
const TELEGRAM_URL  = 'https://t.me/share/url';

function _buildTextSummary(payload) {
    const { source, editableFields, cta, metadata } = payload;
    const headline  = editableFields.find(f => f.key === 'headline')?.value  ?? '';
    const customIntro = editableFields.find(f => f.key === 'customIntro')?.value ?? '';
    const ctaText   = cta?.text ?? '';
    const ctaUrl    = cta?.url  ?? '';
    return [
        headline,
        customIntro ? `\n${customIntro}` : '',
        ctaText && ctaUrl ? `\n→ ${ctaText}: ${ctaUrl}` : '',
        `\n[AIP · ${metadata?.generatedAt?.slice(0, 10) ?? ''}]`,
    ].join('').trim();
}

// ─── [SEC-02] Estrategias de exportación ─────────────────────────────────────

const _strategies = {

    pdf(payload) {
        // Solicita al gadget que active clase @media-print y llama window.print()
        // El gadget ya gestiona la clase; aquí solo disparamos la impresión.
        window.print();
    },

    whatsapp(payload) {
        const text    = encodeURIComponent(_buildTextSummary(payload));
        const phone   = payload.cta?.whatsappPhone ?? '';
        const base    = phone ? `${WHATSAPP_URL}${phone}` : 'https://wa.me/';
        window.open(`${base}?text=${text}`, '_blank', 'noopener,noreferrer');
    },

    telegram(payload) {
        const url  = encodeURIComponent(payload.cta?.url ?? '');
        const text = encodeURIComponent(_buildTextSummary(payload));
        window.open(`${TELEGRAM_URL}?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
    },
};

// ─── [SEC-03] Dispatcher principal ───────────────────────────────────────────

/**
 * @param {'pdf'|'whatsapp'|'telegram'} format
 * @param {object} payload — OutputDocument
 */
export function exportOutput(format, payload) {
    const strategy = _strategies[format];
    if (!strategy) {
        console.warn('[OutputExport] Formato desconocido:', format);
        return;
    }
    console.log(`[OutputExport] → ${format}`, payload);
    strategy(payload);
}

// ─── [SEC-04] Formatters de payload (reutilizables externamente) ──────────────

export { _buildTextSummary as buildTextSummary };
