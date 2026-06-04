// ============================================================
// ARCHIVO  : aip-kyc-gate.js
// VERSIÓN  : 1.0.1
// FECHA    : 2026-06-04
// PROPÓSITO: Web Component L2B — Puerta KYC bloqueada (Gatekeeper).
//            Se muestra cuando el usuario accede a Oportunidades sin KYC suficiente.
//            Reserva Option B (VIBE 1.3+). En Option A activa, aip-crm-home
//            maneja CategorySelected OPP internamente (_renderOpportunityView).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Clase AipKycGate — Web Component
//   [SEC-02a] connectedCallback — viewContext pattern (Option B)
//   [SEC-02b] _renderView — construcción DOM con candado + CTA redirect
// [SEC-03] Registro

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): Solo CSS variables de crm-tokens-v13.css
//   R20 (Event-Driven): Bus canónico CustomEvents en document
//   DT-AIP-05 (XSS Zero-Trust): createElement + textContent, nunca innerHTML con datos externos
//
// FIX v1.0.1 — Bugs originales Bulldozer:
//   1. 'Skeleton:CategorySelected' → correcto: 'Skeleton:Action:CategorySelected'
//   2. document.createElementNS('http://www.w3.org/2000/svg') → faltaba 'svg' como 2º arg
//   3. Pattern cambiado: ya no escucha eventos — usa viewContext inyectado por injectView()
//
// ACTIVACIÓN (Option B — VIBE 1.3+)
//   trinity-layout.injectView('aip-kyc-gate', { categoryId, type:'OPP', label })
//   viewContext disponible en connectedCallback antes del montaje.
//
// EVENTOS EMITIDOS
//   Skeleton:Action:CategorySelected { categoryId, type:'PROC' } — redirige a procedure-view
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones
import { ReactiveElement } from '../03-interface/base/reactive-element.js';

// [SEC-02] Clase AipKycGate — Web Component
class AipKycGate extends ReactiveElement {

    // [SEC-02a] connectedCallback — viewContext pattern
    connectedCallback() {
        const ctx = this.viewContext ?? {};
        if (!ctx.categoryId) {
            console.warn('[KycGate] Sin categoryId en viewContext.');
            return;
        }
        this._renderView(ctx);
    }

    // [SEC-02b] _renderView — candado visual + CTA
    // DT-AIP-05: datos provienen de viewContext (controlado por injectView) — XSS seguro
    _renderView(ctx) {
        this.textContent = ''; // limpieza fiduciaria

        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:16px;';
        wrap.className = 'opp-gate-banner';

        // SVG candado (fix: segundo argumento 'svg' requerido por createElementNS)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.5');
        svg.style.cssText = 'width:56px;height:56px;color:var(--crm-warning);opacity:0.4;';

        const pathBody = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pathBody.setAttribute('x', '3');
        pathBody.setAttribute('y', '11');
        pathBody.setAttribute('width', '18');
        pathBody.setAttribute('height', '11');
        pathBody.setAttribute('rx', '2');

        const pathShackle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathShackle.setAttribute('d', 'M7 11V7a5 5 0 0 1 10 0v4');

        svg.append(pathBody, pathShackle);

        // Título
        const title = document.createElement('h2');
        title.style.cssText = 'font-size:14px;font-weight:600;color:var(--crm-warning);letter-spacing:0.06em;';
        title.textContent = 'ACCESO RESTRINGIDO';

        // Categoría
        const catLabel = document.createElement('p');
        catLabel.style.cssText = 'font-size:10px;font-family:"JetBrains Mono",monospace;letter-spacing:0.08em;text-transform:uppercase;color:var(--crm-text-secondary);';
        catLabel.textContent = ctx.label ?? ctx.categoryId ?? '—';

        // Descripción
        const desc = document.createElement('p');
        desc.style.cssText = 'font-size:11px;color:var(--crm-text-secondary);line-height:1.6;max-width:400px;';
        desc.textContent = 'El acceso a oportunidades de esta categoría requiere completar el proceso de verificación fiduciaria. Su IntegrityScore no cumple los umbrales mínimos de acceso.';

        // Barra de progreso (placeholder)
        const progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;max-width:300px;';
        const progressLabel = document.createElement('div');
        progressLabel.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px;';
        const pLabelLeft = document.createElement('span');
        pLabelLeft.style.cssText = 'font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:var(--crm-text-secondary);';
        pLabelLeft.textContent = 'PROGRESO HACIA SILVER';
        const pLabelRight = document.createElement('span');
        pLabelRight.style.cssText = 'font-family:"JetBrains Mono",monospace;font-size:9px;color:var(--crm-warning);';
        pLabelRight.textContent = '67 / 75';
        progressLabel.append(pLabelLeft, pLabelRight);
        const track = document.createElement('div');
        track.className = 'opp-gate__progress';
        const fill = document.createElement('div');
        fill.className = 'opp-gate__fill';
        fill.style.width = '89%';
        track.appendChild(fill);
        progressWrap.append(progressLabel, track);

        // CTA — redirige a procedure-view (tipo PROC de la misma categoría)
        const ctaBtn = document.createElement('button');
        ctaBtn.className = 'btn-inst btn-primary';
        ctaBtn.style.cssText = 'margin-top:8px;padding:8px 24px;';
        ctaBtn.textContent = 'COMPLETAR KYC PARA ACCEDER';
        ctaBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:Action:CategorySelected', {
                bubbles: true,
                detail: {
                    categoryId:   ctx.categoryId,
                    type:         'PROC',
                    categoryData: ctx.categoryData ?? ctx,
                },
            }));
        });

        wrap.append(svg, title, catLabel, desc, progressWrap, ctaBtn);
        this.appendChild(wrap);
    }
}

// [SEC-03] Registro
customElements.define('aip-kyc-gate', AipKycGate);
export { AipKycGate };
export default AipKycGate;
