// ============================================================
// ARCHIVO  : aip-output-generator.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-22
// PROPÓSITO: Gadget simulador de outputs comerciales AIP.
//            Recibe Skeleton:Output:ContentSelected, renderiza
//            lienzo A4 editable (headline + customIntro) y emite
//            Skeleton:Output:ExportRequested / Cancelled.
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — estilos y tokens
// [SEC-03] Typedef OutputDocument
// [SEC-04] Clase AipOutputGenerator — Web Component
//   [SEC-04a] Campos privados + lifecycle
//   [SEC-04b] connectedCallback / disconnectedCallback
//   [SEC-04c] _buildPayload — construcción del OutputDocument
//   [SEC-04d] _render — DOM completo del gadget
//   [SEC-04e] _wire — event delegation interna
//   [SEC-04f] _onExport — delegar a output-export.js
//   [SEC-04g] _emit — bus canónico de salida
//   [SEC-04h] _printMode — aplicar/quitar @media-print
// [SEC-05] Registro customElements

// DOCTRINA
//   R2  — Light DOM estricto: sin attachShadow()
//   R20 — Sin innerHTML con datos externos (R32 equiv): solo literales de mock frozen
//   R25 — Textos vía data-i18n (headlines configurables, no hardcoded en lógica)
//   DT-AIP-05 — datos de mockState (deepFrozen), seguros para innerHTML de plantilla

// ─── [SEC-01] Importaciones y dependencias ────────────────────────────────────

import { ReactiveElement }   from '../03-interface/base/reactive-element.js';
import { mockState }         from '../verticals/aip/mockState.js';
import { exportOutput }      from './output-export.js';

// ─── [SEC-02] Constantes — estilos y tokens ──────────────────────────────────

const _CSS = `
<style>
/* [SEC-02] aip-output-generator — tokens internos */
:host, aip-output-generator {
    display: block;
    font-family: var(--font-sans, 'Inter', sans-serif);
}

/* ── Contenedor principal (ocupa todo el shell) ── */
.output-gen {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    background: var(--crm-surface, #0a0f1e);
    border: 1px solid var(--crm-border, rgba(255,255,255,0.08));
    border-radius: 12px;
    overflow: hidden;
    max-height: 90vh;
}

/* ── Topbar ── */
.output-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: var(--crm-surface-raised, rgba(255,255,255,0.04));
    border-bottom: 1px solid var(--crm-border, rgba(255,255,255,0.08));
    flex-shrink: 0;
}
.output-topbar__title {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--crm-gold, #c9a84c);
    text-transform: uppercase;
}
.output-topbar__close {
    background: none;
    border: 1px solid var(--crm-border, rgba(255,255,255,0.08));
    border-radius: 4px;
    color: var(--crm-text-secondary, rgba(255,255,255,0.5));
    cursor: pointer;
    font-size: 14px;
    padding: 2px 8px;
    line-height: 1.6;
}
.output-topbar__close:hover { color: var(--crm-text, #fff); }

/* ── Scroll wrapper ── */
.output-scroll {
    overflow-y: auto;
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* ── Canvas A4 ── */
.output-canvas {
    background: #fff;
    color: #111;
    border-radius: 4px;
    padding: 40px 48px;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

/* ── Cabecera del canvas ── */
.canvas-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #111;
    padding-bottom: 16px;
}
.canvas-header__logo {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #111;
}
.canvas-header__badge {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #555;
    border: 1px solid #ccc;
    padding: 3px 8px;
    border-radius: 2px;
    text-transform: uppercase;
}

/* ── Cuerpo editable ── */
.canvas-body { display: flex; flex-direction: column; gap: 12px; }
.canvas-body__headline {
    font-size: 18px;
    font-weight: 700;
    color: #111;
    border: none;
    border-bottom: 1px dashed #ccc;
    background: transparent;
    width: 100%;
    padding: 4px 0;
    font-family: inherit;
}
.canvas-body__headline:focus { outline: none; border-bottom-color: #888; }
.canvas-body__intro {
    font-size: 13px;
    color: #333;
    border: none;
    border-bottom: 1px dashed #ccc;
    background: transparent;
    width: 100%;
    padding: 4px 0;
    font-family: inherit;
    resize: none;
    min-height: 60px;
    line-height: 1.6;
}
.canvas-body__intro:focus { outline: none; border-bottom-color: #888; }

/* ── Steps del procedimiento (read-only) ── */
.canvas-steps { display: flex; flex-direction: column; gap: 8px; }
.canvas-step {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #333;
    align-items: flex-start;
}
.canvas-step__num {
    background: #111;
    color: #fff;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    flex-shrink: 0;
}
.canvas-step__title { font-weight: 600; }

/* ── CTA del canvas ── */
.canvas-cta {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}
.canvas-cta__label { font-size: 12px; color: #555; }
.canvas-cta__link {
    display: inline-block;
    background: #111;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: 4px;
    text-decoration: none;
    letter-spacing: 0.05em;
}

/* ── Footer del canvas ── */
.canvas-footer {
    font-size: 9px;
    color: #999;
    text-align: center;
    border-top: 1px solid #eee;
    padding-top: 8px;
}

/* ── Barra de acciones de export ── */
.output-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-shrink: 0;
}
.output-actions__btn {
    background: var(--crm-surface-raised, rgba(255,255,255,0.06));
    border: 1px solid var(--crm-border, rgba(255,255,255,0.1));
    border-radius: 6px;
    color: var(--crm-text, #fff);
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 8px 16px;
}
.output-actions__btn:hover {
    background: var(--crm-accent-muted, rgba(201,168,76,0.12));
    border-color: var(--crm-gold, #c9a84c);
    color: var(--crm-gold, #c9a84c);
}
.output-actions__btn--primary {
    background: var(--crm-gold, #c9a84c);
    border-color: var(--crm-gold, #c9a84c);
    color: #000;
}
.output-actions__btn--primary:hover { opacity: 0.85; }

/* ── @media print ── */
@media print {
    .output-topbar, .output-actions { display: none !important; }
    .output-gen {
        border: none;
        border-radius: 0;
        max-height: none;
        max-width: none;
        box-shadow: none;
    }
    .output-canvas {
        box-shadow: none;
        border-radius: 0;
        padding: 0;
    }
}
</style>
`;

// ─── [SEC-03] Typedef OutputDocument ─────────────────────────────────────────
//
// {
//   id:    string,
//   type:  'procedimiento' | 'oferta_inmobiliaria' | 'monetizacion',
//   source: { origin: 'category'|'mandate', refId: string, snapshot: object },
//   branding: { logoPrimaryUrl: string },
//   cta:  { text: string, url: string, whatsappPhone: string },
//   editableFields: [{ key: string, value: string, maxLength: number }],
//   metadata: { generatedBy: string, generatedAt: string, clearance: string }
// }

// ─── [SEC-04] Clase AipOutputGenerator ───────────────────────────────────────

class AipOutputGenerator extends ReactiveElement {

    // [SEC-04a] Campos privados + lifecycle
    #contentData   = null;   // snapshot del source (categoryData o mandate)
    #contentType   = null;   // 'procedimiento' | 'oferta_inmobiliaria' | 'monetizacion'
    #refId         = null;

    connectedCallback() {
        super.connectedCallback?.();
        this.innerHTML = _CSS;
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
    }

    // ReactiveElement hook — no necesitamos reaccionar al store aquí
    stateChanged(_state) {}

    // [SEC-04b] Handler del evento de entrada ─────────────────────────────────

    _handleContentSelected({ type, origin, refId }) {
        this.#contentType = type;
        this.#refId       = refId;

        if (type === 'procedimiento' && origin === 'category') {
            this.#contentData = mockState?.categories?.[refId] ?? null;
        } else if (type === 'oferta_inmobiliaria' || type === 'monetizacion') {
            this.#contentData = mockState?.mandates?.find(m => m.id === refId) ?? null;
        }

        if (!this.#contentData) {
            console.warn('[OutputGenerator] Sin datos para refId:', refId);
            return;
        }

        this._render();
        this._wire();
        this._emit('Skeleton:Output:Rendered', { type, refId });
    }

    // [SEC-04c] _buildPayload — construcción del OutputDocument ───────────────

    _buildPayload() {
        const headlineInput = this.querySelector('.canvas-body__headline');
        const introTextarea = this.querySelector('.canvas-body__intro');
        const headline   = headlineInput?.value ?? '';
        const customIntro = introTextarea?.value  ?? '';

        const proc = this.#contentData?.procedure ?? {};
        const ctaContact = proc?.propose_cta?.contact ?? '';

        return {
            id:   `output-${this.#refId}-${Date.now()}`,
            type: this.#contentType,
            source: {
                origin:   'category',
                refId:    this.#refId,
                snapshot: this.#contentData,
            },
            branding: {
                logoPrimaryUrl: '',
            },
            cta: {
                text:          proc?.propose_cta?.label ?? 'PROPONER OPERACIÓN',
                url:           ctaContact.startsWith('http') ? ctaContact : '',
                whatsappPhone: ctaContact.includes('wa.me') ? ctaContact.split('/').pop() : '',
            },
            editableFields: [
                { key: 'headline',    value: headline,    maxLength: 120 },
                { key: 'customIntro', value: customIntro, maxLength: 500 },
            ],
            metadata: {
                generatedBy:  'AIP v1.2.1 · OutputGenerator',
                generatedAt:  new Date().toISOString(),
                clearance:    'BRONZE',
            },
        };
    }

    // [SEC-04d] _render — DOM completo del gadget ─────────────────────────────

    _render() {
        const data   = this.#contentData;
        const proc   = data?.procedure ?? {};
        const label  = data?.label ?? this.#refId ?? '';
        const steps  = proc?.steps ?? [];

        const stepsHtml = steps.slice(0, 5).map(s => `
            <div class="canvas-step">
                <div class="canvas-step__num">${s.order}</div>
                <div>
                    <span class="canvas-step__title">${s.title}</span>
                    ${s.sla ? ` <span style="color:#777;font-size:10px;">· ${s.sla}</span>` : ''}
                </div>
            </div>`).join('');

        const now = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });

        // Preserve edits if user already typed something
        const prevHeadline = this.querySelector('.canvas-body__headline')?.value ?? proc.headline ?? label;
        const prevIntro    = this.querySelector('.canvas-body__intro')?.value    ?? (proc.market_note ?? '');

        const html = `
        <div class="output-gen">

            <!-- output-topbar -->
            <div class="output-topbar">
                <span class="output-topbar__title" data-i18n="output.title">SIMULADOR DE OUTPUT · ${label}</span>
                <button class="output-topbar__close" data-output-action="Cancel" aria-label="Cerrar">✕</button>
            </div>

            <!-- scroll wrapper -->
            <div class="output-scroll">

                <!-- output-canvas (lienzo A4) -->
                <div class="output-canvas" id="output-canvas-print">

                    <!-- Cabecera del canvas -->
                    <div class="canvas-header">
                        <span class="canvas-header__logo">AIP</span>
                        <span class="canvas-header__badge" data-i18n="output.badge">Documento Comercial</span>
                    </div>

                    <!-- Cuerpo editable -->
                    <div class="canvas-body">
                        <input
                            class="canvas-body__headline"
                            type="text"
                            maxlength="120"
                            placeholder="Titular del documento…"
                            value="${_escAttr(prevHeadline)}"
                            data-i18n="output.headline"
                        />
                        <textarea
                            class="canvas-body__intro"
                            maxlength="500"
                            placeholder="Introducción personalizada (opcional)…"
                            data-i18n="output.intro"
                        >${_escText(prevIntro)}</textarea>
                    </div>

                    <!-- Steps read-only -->
                    ${steps.length ? `
                    <div class="canvas-steps">
                        <p style="font-size:10px;font-weight:600;color:#555;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 4px;">
                            Procedimiento
                        </p>
                        ${stepsHtml}
                    </div>` : ''}

                    <!-- CTA del canvas -->
                    <div class="canvas-cta">
                        <span class="canvas-cta__label">${_escText(proc?.propose_cta?.description ?? '')}</span>
                        <span class="canvas-cta__link">${_escText(proc?.propose_cta?.label ?? 'PROPONER OPERACIÓN')}</span>
                    </div>

                    <!-- Footer -->
                    <div class="canvas-footer">
                        AIP · ${now} · Documento generado por AIP v1.2.1 — Confidencial
                    </div>

                </div><!-- /#output-canvas-print -->

                <!-- output-actions -->
                <div class="output-actions">
                    <button class="output-actions__btn" data-output-action="Export" data-format="whatsapp">
                        WhatsApp
                    </button>
                    <button class="output-actions__btn" data-output-action="Export" data-format="telegram">
                        Telegram
                    </button>
                    <button class="output-actions__btn output-actions__btn--primary" data-output-action="Export" data-format="pdf">
                        ⬇ PDF
                    </button>
                </div>

            </div><!-- /.output-scroll -->
        </div><!-- /.output-gen -->
        `;

        // Preservar el bloque de estilo ya inyectado en connectedCallback
        const existingStyle = this.querySelector('style');
        this.innerHTML = html;
        if (existingStyle) this.prepend(existingStyle);
    }

    // [SEC-04e] _wire — event delegation interna ──────────────────────────────

    _wire() {
        this.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-output-action]');
            if (!btn) return;
            const action = btn.dataset.outputAction;
            const format = btn.dataset.format;

            switch (action) {
                case 'Cancel':
                    this._emit('Skeleton:Output:Cancelled', {});
                    break;
                case 'Export':
                    this._onExport(format);
                    break;
            }
        });
    }

    // [SEC-04f] _onExport ─────────────────────────────────────────────────────

    _onExport(format) {
        const payload = this._buildPayload();

        if (format === 'pdf') {
            // Activar modo impresión — canvas visible, chrome oculto
            this._printMode(true);
            setTimeout(() => {
                exportOutput('pdf', payload);
                this._printMode(false);
            }, 120);
        } else {
            exportOutput(format, payload);
        }

        this._emit('Skeleton:Output:ExportRequested', { format, payload });
    }

    // [SEC-04g] _emit ─────────────────────────────────────────────────────────

    _emit(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(eventName, {
            detail: Object.freeze(detail),
            bubbles: true,
        }));
        console.log(`[OutputGenerator] → ${eventName}`, detail);
    }

    // [SEC-04h] _printMode ────────────────────────────────────────────────────

    _printMode(on) {
        this.classList.toggle('print-mode', on);
    }
}

// ─── [SEC-05] Registro customElements ────────────────────────────────────────

customElements.define('aip-output-generator', AipOutputGenerator);

// ─── Helpers internos (no exportados) ────────────────────────────────────────

function _escAttr(str) {
    return String(str ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function _escText(str) {
    return String(str ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
