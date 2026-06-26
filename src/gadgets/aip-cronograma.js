// ============================================================
// ARCHIVO  : aip-cronograma.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-26
// PROPÓSITO: Gadget de visualización de la visión estratégica AIP.
//            Muestra las Fases 0-3 del cronograma (Real Estate,
//            Financiero, Energía, Commodities) en formato timeline
//            interactivo con acordeones expandibles.
//            Gate de acceso: rol ADMIN (superadmin/partner/desk_manager).
//            Montado como TAB D en #orbit3-tab-cronograma (Órbita 3).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes — estilos CSS, datos del cronograma
// [SEC-03] Clase AipCronograma — Web Component
//   [SEC-03a] Campos privados + lifecycle
//   [SEC-03b] _renderLocked — pantalla de acceso restringido
//   [SEC-03c] _renderTimeline — chrome estático del cronograma
//   [SEC-03d] _wire — event delegation (acordeones)
// [SEC-04] Registro customElements

// DOCTRINA
//   R2  — Light DOM estricto: sin attachShadow()
//   R32 — Sin innerHTML con datos externos: todo el contenido es
//         estático (fuente: AIP_cronograma_v1.0.md). Sin datos de usuario.
//   R8  — Textos de UI con data-i18n (fallback ES embebido).
//   R-CROSS-01 — Bus namespace AIP: Skeleton:Cronograma:*

// ─── [SEC-01] Importaciones y dependencias ──────────────────────────────────

import { readState, onStateChange } from '../01-core/app-store.js';

// ─── [SEC-02] Constantes — estilos CSS y datos del cronograma ───────────────

const _ADMIN_ROLES = ['superadmin', 'partner', 'desk_manager'];

const _CSS = `
<style>
/* [SEC-02] aip-cronograma — tokens sobre paleta Abisal */
aip-cronograma { display: block; width: 100%; height: 100%; }

.crn-shell {
    display: flex; flex-direction: column; width: 100%; height: 100%;
    background: #0A0F1E;
    font-family: var(--crm-font-mono, 'JetBrains Mono', 'Courier New', monospace);
    color: rgba(255,255,255,0.85);
    overflow-y: auto;
}

/* Header */
.crn-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(199,162,75,0.2);
    shrink: 0;
}
.crn-header__eyebrow {
    font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase;
    color: #C7A24B; opacity: 0.7; margin-bottom: 4px;
}
.crn-header__title {
    font-size: 13px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #fff;
}
.crn-header__sub {
    font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 3px;
    letter-spacing: 0.08em;
}

/* Timeline */
.crn-timeline {
    display: flex; flex-direction: column; gap: 0;
    padding: 16px 20px 24px;
    flex: 1;
}

/* Fase node */
.crn-fase {
    position: relative; padding-left: 28px; margin-bottom: 4px;
}
.crn-fase::before {
    content: ''; position: absolute; left: 7px; top: 24px;
    width: 1px; bottom: -4px;
    background: linear-gradient(to bottom, rgba(199,162,75,0.4), rgba(199,162,75,0.05));
}
.crn-fase:last-child::before { display: none; }

/* Fase trigger (acordeón header) */
.crn-fase__trigger {
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; padding: 10px 0 8px;
    background: none; border: none; color: inherit;
    font-family: inherit; text-align: left; width: 100%;
    -webkit-tap-highlight-color: transparent;
}
.crn-fase__dot {
    width: 15px; height: 15px; border-radius: 50%; shrink: 0;
    border: 2px solid #C7A24B; background: #0A0F1E;
    position: absolute; left: 0; top: 12px;
    transition: background 0.2s;
    flex-shrink: 0;
}
.crn-fase--open .crn-fase__dot {
    background: #C7A24B;
}
.crn-fase__label {
    font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase;
    color: #C7A24B; opacity: 0.8; display: block; margin-bottom: 1px;
}
.crn-fase__title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: rgba(255,255,255,0.9);
    display: block;
}
.crn-fase__chevron {
    margin-left: auto; font-size: 14px; color: rgba(199,162,75,0.5);
    transition: transform 0.25s ease; shrink: 0; flex-shrink: 0;
}
.crn-fase--open .crn-fase__chevron { transform: rotate(180deg); }

/* Acordeón body */
.crn-fase__body {
    display: none; padding: 0 0 14px 0;
}
.crn-fase--open .crn-fase__body { display: block; }

/* Subgrupos dentro de cada fase */
.crn-grupo {
    margin-bottom: 12px;
    border: 1px solid rgba(199,162,75,0.1);
    border-radius: 6px;
    background: rgba(199,162,75,0.03);
    padding: 10px 12px;
}
.crn-grupo__label {
    font-size: 7px; letter-spacing: 0.3em; text-transform: uppercase;
    color: #C7A24B; opacity: 0.7; margin-bottom: 6px;
}
.crn-grupo__title {
    font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.8);
    margin-bottom: 4px;
}
.crn-item {
    font-size: 9px; color: rgba(255,255,255,0.55); line-height: 1.6;
    margin-bottom: 2px; padding-left: 8px; border-left: 1px solid rgba(199,162,75,0.2);
}
.crn-item strong { color: rgba(255,255,255,0.75); font-weight: 600; }

/* Interconexiones */
.crn-inter {
    margin-top: 8px; padding: 12px 16px;
    border: 1px solid rgba(199,162,75,0.15);
    border-radius: 8px; background: rgba(7,10,16,0.6);
}
.crn-inter__title {
    font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase;
    color: #C7A24B; margin-bottom: 8px; opacity: 0.8;
}
.crn-inter__row {
    font-size: 9px; color: rgba(255,255,255,0.55); line-height: 1.7;
    padding-left: 10px; border-left: 1px solid rgba(199,162,75,0.25);
    margin-bottom: 6px;
}
.crn-inter__row strong { color: #C7A24B; }

/* Locked */
.crn-locked {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height: 100%; gap: 10px;
    color: rgba(255,255,255,0.3); text-align: center; padding: 32px;
}
.crn-locked__icon { font-size: 28px; color: rgba(199,162,75,0.3); }
.crn-locked__label {
    font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(199,162,75,0.5);
}
</style>`;

// Contenido estático del cronograma (fuente: AIP_cronograma_v1.0.md)
// R32: datos puramente estáticos — sin interpolación de datos de usuario.
const _FASES = [
    {
        id: 'fase-0',
        label: 'Fase 0',
        title: 'Fundamentos y despliegue AIP',
        grupos: [
            {
                label: 'Base de operaciones',
                title: 'Sede Madrid y Hub Digital',
                items: [
                    '<strong>Operativa Física:</strong> Coordinación y estructuración matriz desde la sede en Calle Castelló, Madrid.',
                    '<strong>Infraestructura Digital:</strong> Sistema web de máxima eficiencia lanzado en 4 semanas (integrado con IA).',
                ],
            },
        ],
    },
    {
        id: 'fase-1',
        label: 'Fase 1',
        title: 'Inversión y posicionamiento · Portugal',
        grupos: [
            {
                label: 'Real Estate',
                title: 'Joint Venture — Entroncamento',
                items: [
                    '<strong>Estructura:</strong> Desarrollo de 72 viviendas modulares (Tecnología 0% cemento).',
                    '<strong>Inyección Lead Investor (500k€):</strong> 50k€ (Equity S.A.) + 450k€ (Préstamo) para arranque comercial del Lote 1.',
                    '<strong>Protección IP:</strong> Integración de TOGAMU bajo Project Management. Equity bloqueado por Stock Options supeditadas a la matriz en España.',
                ],
            },
            {
                label: 'Financiero',
                title: 'Posicionamiento Bancario',
                items: [
                    '<strong>Operación:</strong> Entrada accionarial (7,94%) en banco comercial de Portugal.',
                    '<strong>Impacto:</strong> Fluidez sistémica para operaciones europeas, canal financiero corporativo propio.',
                ],
            },
            {
                label: 'Expansión',
                title: 'Misión Asia — LPS Shanghai',
                items: [
                    '<strong>Hito (Dic 2026):</strong> Acceso VIP a +17.300 inversores chinos HNWI.',
                    '<strong>Objetivo:</strong> Comercialización del proyecto, networking con Sotheby\'s / Emaar y creación de vehículo Portugal-Asia.',
                ],
            },
        ],
    },
    {
        id: 'fase-23',
        label: 'Fases 2 & 3',
        title: 'Energía, Commodities y SBLC',
        grupos: [
            {
                label: 'Infraestructura',
                title: 'Hub Energético — Portugal',
                items: [
                    '<strong>Tanqueras Setúbal:</strong> Adquisición de suelo y construcción de infraestructura de almacenamiento.',
                    '<strong>Red Retail:</strong> Despliegue de red independiente de estaciones de servicio con tancaje propio.',
                ],
            },
            {
                label: 'Trading',
                title: 'Multicommodity Brokerage',
                items: [
                    '<strong>Alcance:</strong> Metanol, urea, crudo y gas. (Operaciones amparadas por acceso a naviera).',
                    '<strong>Rol:</strong> Captación diaria de commodities, actuando como broker estructural en el lado de compra.',
                ],
            },
            {
                label: 'Garantías',
                title: 'Instrumentos SBLC',
                items: [
                    '<strong>Herramienta:</strong> Standby Letters of Credit (SBLC) como palanca para agilizar contratos multimillonarios de commodities.',
                ],
            },
        ],
    },
];

const _INTERCONEXIONES = [
    { key: 'Real Estate ↔ Finanzas', desc: 'La posición bancaria facilita líneas hipotecarias para los clientes de Entroncamento y aporta garantías corporativas a la Joint Venture.' },
    { key: 'Real Estate ↔ Misión Shanghai', desc: 'Los inversores asiáticos no solo compran el inventario residencial — abren el capital para escalar las operaciones energéticas.' },
    { key: 'SBLC ↔ Commodities', desc: 'El dominio de SBLC es la ventaja competitiva definitiva: permite mover grandes flujos energéticos sin bloquear liquidez de la matriz.' },
];

// ─── [SEC-03] Clase AipCronograma — Web Component ───────────────────────────

class AipCronograma extends HTMLElement {

    // [SEC-03a] Campos privados + lifecycle
    #_unsubAuth = null;

    connectedCallback() {
        this._checkAndRender();
        // Reacción reactiva: si el usuario se autentica/desautentica mientras el tab está visible
        this.#_unsubAuth = onStateChange((state) => {
            const role = state?.auth?.role;
            const isAdmin = _ADMIN_ROLES.includes(role);
            const hasShell  = this.querySelector('.crn-shell');
            const hasLocked = this.querySelector('.crn-locked');
            if (isAdmin && !hasShell) this._renderTimeline();
            if (!isAdmin && !hasLocked) this._renderLocked();
        });
    }

    disconnectedCallback() {
        this.#_unsubAuth?.();
    }

    _checkAndRender() {
        const role = readState()?.auth?.role;
        if (_ADMIN_ROLES.includes(role)) {
            this._renderTimeline();
        } else {
            this._renderLocked();
        }
    }

    // [SEC-03b] _renderLocked — pantalla acceso restringido
    _renderLocked() {
        // R32: solo chrome estático, cero datos externos
        this.innerHTML = `${_CSS}
<div class="crn-locked">
    <span class="crn-locked__icon material-symbols-outlined">lock</span>
    <span class="crn-locked__label" data-i18n="cronograma.locked">Acceso restringido · Solo ADMIN</span>
</div>`;
    }

    // [SEC-03c] _renderTimeline — chrome estático del cronograma
    _renderTimeline() {
        // R32: todo el contenido es estático (AIP_cronograma_v1.0.md).
        // innerHTML para chrome estático — zero datos de usuario.

        const fasesHTML = _FASES.map(fase => {
            const gruposHTML = fase.grupos.map(g => `
<div class="crn-grupo">
    <div class="crn-grupo__label">${g.label}</div>
    <div class="crn-grupo__title">${g.title}</div>
    ${g.items.map(i => `<div class="crn-item">${i}</div>`).join('')}
</div>`).join('');

            return `
<div class="crn-fase" id="${fase.id}">
    <div class="crn-fase__dot"></div>
    <button class="crn-fase__trigger" type="button" data-fase="${fase.id}"
            aria-expanded="false">
        <div>
            <span class="crn-fase__label">${fase.label}</span>
            <span class="crn-fase__title">${fase.title}</span>
        </div>
        <span class="crn-fase__chevron material-symbols-outlined">expand_more</span>
    </button>
    <div class="crn-fase__body">
        ${gruposHTML}
    </div>
</div>`;
        }).join('');

        const interHTML = _INTERCONEXIONES.map(i => `
<div class="crn-inter__row">
    <strong>${i.key}:</strong> ${i.desc}
</div>`).join('');

        this.innerHTML = `${_CSS}
<div class="crn-shell">
    <div class="crn-header">
        <div class="crn-header__eyebrow" data-i18n="cronograma.eyebrow">Visión estratégica · AIP v1.2.1</div>
        <div class="crn-header__title" data-i18n="cronograma.title">Cronograma operativo</div>
        <div class="crn-header__sub" data-i18n="cronograma.sub">Fases 0 – 3 · Real Estate · Energía · Commodities</div>
    </div>

    <div class="crn-timeline">
        ${fasesHTML}

        <div class="crn-inter">
            <div class="crn-inter__title" data-i18n="cronograma.interconexiones">El efecto multiplicador — Interconexiones estratégicas</div>
            ${interHTML}
        </div>
    </div>
</div>`;

        this._wire();
    }

    // [SEC-03d] _wire — event delegation (acordeones)
    _wire() {
        this.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-fase]');
            if (!trigger) return;
            const faseEl = trigger.closest('.crn-fase');
            if (!faseEl) return;
            const isOpen = faseEl.classList.toggle('crn-fase--open');
            trigger.setAttribute('aria-expanded', String(isOpen));
        });
    }
}

// ─── [SEC-04] Registro customElements ───────────────────────────────────────

customElements.define('aip-cronograma', AipCronograma);
