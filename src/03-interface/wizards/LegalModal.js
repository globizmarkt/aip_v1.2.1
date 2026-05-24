// ============================================================
// ARCHIVO  : LegalModal.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-24
// PROPÓSITO: Guardián legal fluido post-Golden Gate (E3-T02).
//            Aparece al cruzar el Airlock (GateCrossed), solicita atestación
//            institucional y, tras confirmación, revela el CRM Dashboard.
//            Fricción ESTÉTICA / EDUCATIVA — no es un hard-lock operativo.
//            El KYC real ocurre dentro del CRM (Épica 4+).
// ============================================================
// ÉPICA    : E3 — Onboarding Spine
// TICKET   : E3-T02
// AGENTE   : Claude Code
// DOCTRINA : R20 (Event-Driven) · R18 (ES Modules) · R14 (Fricción deliberada — estética)
//            R25 (Zero-DOM — acceso DOM solo en handler y cleanup)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Plantilla HTML del modal
// [SEC-03] Inyección y cleanup del DOM
// [SEC-04] Módulo LegalModal (init)
// [SEC-05] Export

// ============================================================
// [SEC-01] Importaciones
// ============================================================

import { PassportEngine } from '../../01-core/passport/PassportEngine.js';

// ============================================================
// [SEC-02] Plantilla HTML del modal
// ============================================================

const MODAL_ID = 'legal-modal-overlay';
const CONFIRM_BTN_ID = 'legal-modal-confirm';

function _buildTemplate() {
    return `
<div id="${MODAL_ID}" class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/80">
    <div class="stitch-panel border border-[var(--stitch-border)] max-w-md w-full mx-4 p-8 flex flex-col gap-6">
        <div class="border-b border-[var(--stitch-border)] pb-4">
            <p class="text-[8px] uppercase tracking-[0.4em] font-mono text-white/40">COMPLIANCE · AIP PLATFORM</p>
            <h2 class="mt-2 text-[13px] uppercase tracking-[0.3em] font-mono text-[var(--stitch-gold)]">INSTITUTIONAL ATTESTATION</h2>
        </div>
        <p class="text-[11px] font-mono text-white/60 leading-relaxed">
            By entering this platform you acknowledge that AIP operates under strict
            fiduciary and regulatory protocols. All interactions are recorded in an
            immutable compliance ledger. This environment is restricted to qualified
            investors and authorized agents.
        </p>
        <button type="button" id="${CONFIRM_BTN_ID}"
            class="w-full border border-[var(--stitch-gold)]/70 text-[var(--stitch-gold)] text-[10px] uppercase tracking-[0.35em] font-mono py-3 px-6 hover:bg-[var(--stitch-gold)] hover:text-background transition-all duration-500">
            [ I ATTEST AND ENTER ]
        </button>
    </div>
</div>`;
}

// ============================================================
// [SEC-03] Inyección y cleanup del DOM
// ============================================================

function _injectModal() {
    document.body.insertAdjacentHTML('beforeend', _buildTemplate());

    const btn = document.getElementById(CONFIRM_BTN_ID);
    if (!btn) return;

    btn.addEventListener('click', _onConfirm, { once: true });
    console.log('[LegalModal] Modal de atestación institucional inyectado.');
}

function _onConfirm() {
    // Elevación fiduciaria: visitante anónimo → EMBRYONIC (BRONZE clearance)
    PassportEngine.setArchetype('EMBRYONIC');

    // Señal canónica — main.js revela el CRM Dashboard
    document.dispatchEvent(new CustomEvent('Skeleton:Legal:Accepted', {
        detail: Object.freeze({ kyc_tier: 1, archetype: 'EMBRYONIC' }),
        bubbles: true,
    }));

    console.log('[LegalModal] Atestación confirmada → Skeleton:Legal:Accepted emitido.');

    // Auto-destrucción (R25 — DOM limpio tras uso)
    document.getElementById(MODAL_ID)?.remove();
}

// ============================================================
// [SEC-04] Módulo LegalModal (init)
// ============================================================

export const LegalModal = {

    /**
     * Registra el guardián legal en el bus de eventos.
     * Escucha Skeleton:Action:GateCrossed (once) — el modal aparece
     * exactamente una vez por sesión, al cruzar el Golden Gate.
     */
    init() {
        document.addEventListener('Skeleton:Action:GateCrossed', _injectModal, { once: true });
        console.log('[LegalModal] Guardián legal fluido en espera de Golden Gate.');
    },
};

// ============================================================
// [SEC-05] Export
// ============================================================

export default LegalModal;
