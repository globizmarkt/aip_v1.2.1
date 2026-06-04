// ============================================================
// ARCHIVO  : aip-procedure-view.js
// VERSIÓN  : 1.0.1
// FECHA    : 2026-06-04
// PROPÓSITO: Web Component L2A — Vista de procedimiento operativo.
//            Muestra el itinerario, requisitos KYC y CTA al siguiente nivel.
//            Reserva Option B (VIBE 1.3+). En Option A activa, aip-crm-home
//            maneja CategorySelected internamente (_renderProcedureView).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Clase AipProcedureView — Web Component
//   [SEC-02a] connectedCallback — viewContext pattern (Option B)
//   [SEC-02b] _renderView — construcción DOM
// [SEC-03] Registro

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): Solo CSS variables de crm-tokens-v13.css
//   R20 (Event-Driven): Bus canónico CustomEvents en document
//   DT-AIP-05 (XSS Zero-Trust): createElement + textContent, nunca innerHTML con datos externos
//
// FIX v1.0.1 — Bug original Bulldozer:
//   'Skeleton:CategorySelected' → correcto: 'Skeleton:Action:CategorySelected'
//   Pattern cambiado: ya no escucha eventos — usa viewContext inyectado por injectView()
//
// ACTIVACIÓN (Option B — VIBE 1.3+)
//   trinity-layout.injectView('aip-procedure-view', { categoryId, type:'PROC', label, categoryData })
//   viewContext disponible en connectedCallback antes del montaje.
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones
import { ReactiveElement } from '../03-interface/base/reactive-element.js';

// [SEC-02] Clase AipProcedureView — Web Component
class AipProcedureView extends ReactiveElement {

    // [SEC-02a] connectedCallback — viewContext pattern
    connectedCallback() {
        const ctx = this.viewContext ?? {};
        if (!ctx.categoryId) {
            console.warn('[ProcedureView] Sin categoryId en viewContext.');
            return;
        }
        this._renderView(ctx);
    }

    // [SEC-02b] _renderView — construcción DOM
    // DT-AIP-05: datos provienen de viewContext (controlado por injectView) — XSS seguro
    _renderView(ctx) {
        this.textContent = ''; // limpieza fiduciaria

        const wrap = document.createElement('div');
        wrap.className = 'proc-view';

        // Breadcrumb
        const breadcrumb = document.createElement('div');
        breadcrumb.className = 'crm-home__subbar';
        breadcrumb.style.display = 'flex';

        const backBtn = document.createElement('button');
        backBtn.className = 'btn-inst';
        backBtn.style.cssText = 'padding:4px 12px;font-size:9px;';
        backBtn.textContent = '← VOLVER';
        backBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:Action:BackToPortfolio', { bubbles: true }));
        });

        const sep = document.createElement('span');
        sep.className = 'label-sm ghost';
        sep.textContent = '/';

        const crumb = document.createElement('span');
        crumb.className = 'label-sm';
        crumb.style.color = 'var(--crm-accent)';
        crumb.textContent = 'PROCEDIMIENTO';

        breadcrumb.append(backBtn, sep, crumb);

        // Título
        const title = document.createElement('h2');
        title.style.cssText = 'font-size:15px;font-weight:600;';
        title.textContent = ctx.label ?? ctx.categoryId ?? '—';

        // Nota pedagógica
        const note = document.createElement('div');
        note.className = 'proc-market-note';
        note.textContent = ctx.categoryData?.procedure?.market_note
            ?? 'Consulte el itinerario operativo para esta categoría.';

        // Bloque KYC niveles
        const kycBlock = document.createElement('div');
        kycBlock.style.cssText = 'background:var(--crm-surface);border:1px solid var(--crm-border);padding:16px 20px;';

        const kycTitle = document.createElement('p');
        kycTitle.className = 'label-xs';
        kycTitle.style.cssText = 'color:var(--crm-accent);margin-bottom:12px;';
        kycTitle.textContent = 'NIVELES DE VERIFICACIÓN';

        // Nivel 1
        const lvl1 = document.createElement('div');
        lvl1.style.cssText = 'border-left:2px solid var(--crm-accent);padding-left:12px;margin-bottom:12px;';
        const lvl1Title = document.createElement('p');
        lvl1Title.style.cssText = 'font-size:11px;font-weight:600;margin-bottom:4px;';
        lvl1Title.textContent = 'NIVEL 1 — VISIÓN PEDAGÓGICA (ESPECIALISTA IDEALISTA)';
        const lvl1Desc = document.createElement('p');
        lvl1Desc.style.cssText = 'font-size:10px;color:var(--crm-text-secondary);line-height:1.5;';
        lvl1Desc.textContent = 'Accede a descripciones pedagógicas y estructuras de mercado. Se asume riesgo de interpretación sin la validación completa del contexto fiduciario.';
        lvl1.append(lvl1Title, lvl1Desc);

        // Nivel 2
        const lvl2 = document.createElement('div');
        lvl2.style.cssText = 'border-left:2px solid color-mix(in srgb, var(--crm-accent) 40%, transparent);padding-left:12px;opacity:0.6;';
        const lvl2Title = document.createElement('p');
        lvl2Title.style.cssText = 'font-size:11px;font-weight:600;margin-bottom:4px;';
        lvl2Title.textContent = 'NIVEL 2 — VERIFICACIÓN CIEGA (KYC TIER 2)';
        const lvl2Desc = document.createElement('p');
        lvl2Desc.style.cssText = 'font-size:10px;color:var(--crm-text-secondary);line-height:1.5;';
        lvl2Desc.textContent = 'Integridad verificada. El inversor no ve la identidad de la contraparte hasta completar la Triple Esclusa de Cumplimiento. Requiere superar KYC Tier 2.';
        lvl2.append(lvl2Title, lvl2Desc);

        kycBlock.append(kycTitle, lvl1, lvl2);

        // CTA
        const ctaZone = document.createElement('div');
        ctaZone.className = 'proc-cta-zone';

        const ctaInfo = document.createElement('div');
        ctaInfo.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
        const ctaLabel = document.createElement('p');
        ctaLabel.className = 'label-xs';
        ctaLabel.style.color = 'var(--crm-gold)';
        ctaLabel.textContent = 'SOLICITAR AVANCE DE NIVEL';
        const ctaDesc = document.createElement('p');
        ctaDesc.style.cssText = 'font-size:11px;color:var(--crm-text-secondary);';
        ctaDesc.textContent = 'Complete KYC Tier 2 para desbloquear oportunidades y acceso a la contraparte.';
        ctaInfo.append(ctaLabel, ctaDesc);

        const ctaBtn = document.createElement('button');
        ctaBtn.className = 'btn-inst btn-primary';
        ctaBtn.style.cssText = 'flex-shrink:0;padding:8px 20px;';
        ctaBtn.textContent = 'INICIAR KYC TIER 2';
        ctaBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('Skeleton:CRM:KycInitiated', {
                bubbles: true,
                detail: { tier: 2, from: ctx.categoryId },
            }));
        });

        ctaZone.append(ctaInfo, ctaBtn);

        wrap.append(breadcrumb, title, note, kycBlock, ctaZone);
        this.appendChild(wrap);
    }
}

// [SEC-03] Registro
customElements.define('aip-procedure-view', AipProcedureView);
export { AipProcedureView };
export default AipProcedureView;
