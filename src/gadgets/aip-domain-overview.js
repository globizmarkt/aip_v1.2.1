// ============================================================
// ARCHIVO  : aip-domain-overview.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-04
// PROPÓSITO: Web Component L1 — Vista pedagógica de dominio.
//            Inyectado por aip-trinity-layout.injectView() en Opción B (VIBE 1.3+).
//            En Opción A activa, aip-crm-home._renderDomainOverview() cubre esta función.
//            Este archivo es la implementación standalone para el futuro.
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Constantes — DOMAIN_CONTENT map (contenido institucional por domainId)
// [SEC-03] Clase AipDomainOverview — Web Component
//   [SEC-03a] connectedCallback — lectura de viewContext + render inicial
//   [SEC-03b] _render — construcción DOM
// [SEC-04] Registro customElements

// ─────────────────────────────────────────────────────────────────────────────
// DOCTRINA
//   R2  (Light DOM Estricto): attachShadow() PROHIBIDO
//   R3  (Zero-Hex): Solo CSS variables de crm-tokens-v13.css
//   R20 (Event-Driven): Bus canónico CustomEvents en document
//   R25 (Sensores ciegos): sin lógica de negocio en la vista
//   DT-AIP-05 (XSS Zero-Trust): createElement + textContent, nunca innerHTML con datos externos
//
// PATRÓN DE ACTIVACIÓN (Opción B — VIBE 1.3+)
//   trinity-layout._wireViewBus() emite injectView('aip-domain-overview', { domain: domainId })
//   viewContext = { domain: 'ma-real-estate' | 'commodities-trade' | ... }
//
// EN OPCIÓN A (activa):
//   aip-crm-home._renderDomainOverview() maneja la vista internamente.
//   Este componente no recibe eventos — no está conectado al bus hasta Option B.
// ─────────────────────────────────────────────────────────────────────────────

// [SEC-01] Importaciones
import { ReactiveElement } from '../03-interface/base/reactive-element.js';

// [SEC-02] DOMAIN_CONTENT map — contenido institucional sellado
const DOMAIN_CONTENT = Object.freeze({
    'ma-real-estate': Object.freeze({
        title:    'M&A & Real Estate',
        pedagogy: 'Este dominio agrupa operaciones de compraventa de empresas y activos inmobiliarios dentro de AIP. Cubre mandatos de adquisición, desinversión, estructuración de transacciones y coordinación de debida diligencia. Su usuario natural es el inversor corporativo, patrimonial o institucional que busca ejecutar operaciones con gobernanza, documentación y cierre controlado.',
        nav:      'Encontrará flujos por tipo de operación (M&A, RE comercial, RE premium/residencial) y estado (evaluación, mandato, cierre). Incluye requisitos de información, hitos de proceso y canal de coordinación documental.',
        kyc:      'Antes de iniciar gestiones, AIP verificará identidad, beneficiario final y origen de fondos conforme a AML/KYC; la información se solicita para cumplir obligaciones legales y de debida diligencia.',
        categories: [
            { id: 'compraventa-empresarial', label: 'Compraventa Empresarial' },
            { id: 'real-estate-comercial',   label: 'Real Estate Comercial'   },
            { id: 'real-estate-premium',     label: 'Real Estate Premium / Residencial' },
        ],
    }),
    'commodities-trade': Object.freeze({
        title:    'Commodities & Trade Finance',
        pedagogy: 'Este dominio aborda operaciones vinculadas a commodities y a su financiamiento comercial. Cubre originación y ejecución de compra/venta, logística documental, mitigación de riesgo de contraparte y estructuras de trade finance asociadas. Su usuario natural es el inversor, productor o comercializador que requiere control de riesgos, trazabilidad y disciplina de cumplimiento.',
        nav:      'Encontrará rutas por vertical (energía, agrícola, metales/minería) y por tipo de instrumento (spot/forward, prefinanciación, cartas de crédito, garantías). Incluye checklist documental, hitos operativos y estándares de verificación.',
        kyc:      'Por políticas de cumplimiento y prevención de lavado, AIP podrá requerir documentación de contraparte, beneficiario final, actividad económica y trazabilidad de fondos/mercancía antes de avanzar.',
        categories: [
            { id: 'energia-derivados', label: 'Energía & Derivados' },
            { id: 'agricola-soft',     label: 'Agrícola & Soft'     },
            { id: 'metales-mineria',   label: 'Metales & Minería'   },
        ],
    }),
    'soluciones-financieras': Object.freeze({
        title:    'Soluciones Financieras',
        pedagogy: 'Este dominio reúne estructuras de capital para financiar crecimiento, adquisiciones o reordenamiento financiero. Cubre deuda, equity e instrumentos híbridos, con análisis de riesgo, términos, covenants y coordinación de cierre. Su usuario natural es el inversor profesional o la empresa que necesita una solución alineada a flujo de caja, gobierno corporativo y horizonte.',
        nav:      'Encontrará módulos por tipo de solución (deuda, equity, híbridos) y por etapa (diagnóstico, estructuración, colocación/cierre). Incluye parámetros clave, documentación requerida y ruta de aprobación interna.',
        kyc:      'AIP actúa bajo estándares fiduciarios y de debida diligencia; se solicitará información para validar idoneidad, beneficiario final y origen de fondos antes de presentar o ejecutar estructuras.',
        categories: [
            { id: 'deuda-estructurados',   label: 'Deuda & Estructurados'    },
            { id: 'equity-capital',        label: 'Equity & Capital'          },
            { id: 'hibridos-alternativos', label: 'Híbridos & Alternativos'   },
        ],
    }),
    'aip-ventures': Object.freeze({
        title:    'AIP Ventures',
        pedagogy: 'Este dominio se orienta a inversiones en empresas de alto crecimiento mediante venture equity, growth capital y estructuras. Cubre evaluación, términos de inversión, gobernanza, derechos económicos y escenarios de salida. Su usuario natural es el inversor sofisticado que acepta mayor incertidumbre a cambio de potencial de retorno, con foco en control de riesgos y transparencia.',
        nav:      'Encontrará oportunidades por etapa (venture/growth) y por tipo de instrumento (equity, convertibles, estructurados). Incluye data room, métricas mínimas, términos preliminares y flujo de aprobación/ejecución.',
        kyc:      'Antes de habilitar acceso a información o procesos, AIP verificará identidad, perfil y origen de fondos; la validación KYC/AML es condición para continuar y protege a todas las partes.',
        categories: [
            { id: 'venture-equity',        label: 'Venture Equity'        },
            { id: 'growth-capital',        label: 'Growth Capital'        },
            { id: 'estructurados-venture', label: 'Estructurados Venture' },
        ],
    }),
});

// [SEC-03] Clase AipDomainOverview — Web Component
class AipDomainOverview extends ReactiveElement {

    // [SEC-03a] connectedCallback — lectura de viewContext + render inicial
    connectedCallback() {
        // Opción B: el viewContext es inyectado por trinity-layout.injectView() ANTES
        // de appendChild, por lo tanto ya está disponible en connectedCallback.
        const ctx = this.viewContext ?? {};
        const domainId = ctx.domain ?? this.dataset.id ?? null;
        if (!domainId) {
            console.warn('[DomainOverview] Sin domainId en viewContext — no renderiza.');
            return;
        }
        this._renderView(domainId);
    }

    // [SEC-03b] _renderView — construcción DOM fiduciaria
    // DT-AIP-05: todos los datos vienen de DOMAIN_CONTENT (Object.freeze) — XSS seguro
    _renderView(domainId) {
        const d = DOMAIN_CONTENT[domainId];
        if (!d) {
            const err = document.createElement('p');
            err.className = 'label-xs ghost';
            err.style.padding = '24px';
            err.textContent = `Dominio desconocido: ${domainId}`;
            this.appendChild(err);
            return;
        }

        this.textContent = ''; // limpieza fiduciaria

        // ── Wrapper ──────────────────────────────────────────────────────────────
        const wrap = document.createElement('div');
        wrap.className = 'proc-view';

        // ── Encabezado ────────────────────────────────────────────────────────────
        const headerBlock = document.createElement('div');
        headerBlock.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        const eyebrow = document.createElement('p');
        eyebrow.className = 'label-xs ghost';
        eyebrow.textContent = 'RESUMEN DEL DOMINIO';

        const title = document.createElement('h2');
        title.style.cssText = 'font-size:16px;font-weight:600;';
        title.textContent = d.title;

        const pedagogy = document.createElement('div');
        pedagogy.className = 'proc-market-note';
        pedagogy.style.cssText = 'font-size:12px;line-height:1.7;';
        pedagogy.textContent = d.pedagogy;

        headerBlock.append(eyebrow, title, pedagogy);

        // ── Guía de navegación ────────────────────────────────────────────────────
        const navBlock = document.createElement('div');
        navBlock.style.cssText = 'background:var(--crm-surface);border:1px solid var(--crm-border);padding:16px 20px;';

        const navLabel = document.createElement('p');
        navLabel.className = 'label-xs ghost';
        navLabel.style.marginBottom = '10px';
        navLabel.textContent = 'GUÍA DE NAVEGACIÓN';

        const navText = document.createElement('p');
        navText.style.cssText = 'font-size:11px;color:var(--crm-text-secondary);line-height:1.6;margin-bottom:16px;';
        navText.textContent = d.nav;

        const catList = document.createElement('div');
        catList.style.cssText = 'display:flex;flex-direction:column;gap:0;border:1px solid var(--crm-border);';

        d.categories.forEach((cat, idx) => {
            const row = document.createElement('div');
            row.style.cssText = `padding:10px 14px;display:flex;align-items:center;gap:10px;background:var(--crm-abyss);${idx < d.categories.length - 1 ? 'border-bottom:1px solid var(--crm-border);' : ''}cursor:pointer;transition:background 150ms ease;`;
            row.addEventListener('mouseover', () => row.style.background = 'color-mix(in srgb, var(--crm-text-primary) 2%, var(--crm-abyss))');
            row.addEventListener('mouseout', () => row.style.background = 'var(--crm-abyss)');

            const dot = document.createElement('span');
            dot.style.cssText = 'width:4px;height:4px;border-radius:50%;background:var(--crm-accent);flex-shrink:0;';

            const catLabel = document.createElement('span');
            catLabel.style.fontSize = '11px';
            catLabel.textContent = cat.label;

            const badgeProc = document.createElement('span');
            badgeProc.className = 'badge badge--maturing';
            badgeProc.style.cssText = 'margin-left:auto;font-size:8px;';
            badgeProc.textContent = 'PROC';

            const badgeOpp = document.createElement('span');
            badgeOpp.className = 'badge badge--blocked';
            badgeOpp.style.fontSize = '8px';
            badgeOpp.textContent = '🔒 OPP';

            row.append(dot, catLabel, badgeProc, badgeOpp);
            catList.appendChild(row);
        });

        navBlock.append(navLabel, navText, catList);

        // ── KYC Notice fiduciario ─────────────────────────────────────────────────
        const notice = document.createElement('div');
        notice.className = 'notice-plate';

        const noticeIcon = document.createElement('span');
        noticeIcon.className = 'mono';
        noticeIcon.style.cssText = 'font-size:11px;color:var(--crm-warning);flex-shrink:0;margin-top:1px;';
        noticeIcon.textContent = '⚠';

        const noticeBody = document.createElement('div');

        const noticeTitle = document.createElement('p');
        noticeTitle.className = 'label-xs';
        noticeTitle.style.cssText = 'color:var(--crm-warning);margin-bottom:3px;';
        noticeTitle.textContent = 'VERIFICACIÓN KYC REQUERIDA';

        const noticeText = document.createElement('p');
        noticeText.style.cssText = 'font-size:11px;color:var(--crm-text-secondary);line-height:1.5;';
        noticeText.textContent = d.kyc;

        noticeBody.append(noticeTitle, noticeText);
        notice.append(noticeIcon, noticeBody);

        wrap.append(headerBlock, navBlock, notice);
        this.appendChild(wrap);
    }
}

// [SEC-04] Registro
customElements.define('aip-domain-overview', AipDomainOverview);
export { AipDomainOverview };
export default AipDomainOverview;
