/**
 * @file aip-legal-attestation.js
 * @description Componente reactivo del Peaje Legal (Órbita 3).
 * Primer nodo interactivo integrado con el ciclo Zero-Trust v1.3.
 * Geometría auditada: Austeridad Fiduciaria (R-Radius: 0px paneles, 2px botones).
 */

import { ReactiveElement } from '../../base/reactive-element.js';

export class AipLegalAttestation extends ReactiveElement {
    constructor() {
        super();
        // Referencias internas a los nodos mutables
        this._btnAccept = null;
        this._btnReject = null;
    }

    connectedCallback() {
        // 1. Inyección del esqueleto estático (Seguro por defecto, inmune a XSS)
        this.innerHTML = `
            <div style="
                background: rgba(9, 16, 30, 0.97);
                border: 1px solid rgba(212, 185, 110, 0.22);
                border-top: 2px solid rgba(212, 185, 110, 0.55);
                padding: 2.5rem;
                width: 100%;
                max-width: 560px;
                box-sizing: border-box;
                font-family: system-ui, sans-serif;
                box-shadow: 0 12px 48px rgba(0, 0, 0, 0.65);
            ">
                <h2 style="
                    color: var(--stitch-gold, #D4B96E);
                    margin: 0 0 1.25rem;
                    font-size: 1.35rem;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                    text-decoration: none;
                " data-i18n="legal.title">
                    Atestación Fiduciaria Institucional
                </h2>

                <p style="
                    color: #BDC8D8;
                    line-height: 1.65;
                    margin: 0 0 1.5rem;
                    font-size: 0.9rem;
                    text-decoration: none;
                " data-i18n="legal.description">
                    Al acceder a la Órbita 3 del sistema, usted acepta los términos de intermediación institucional, la política de custodia de activos y la trazabilidad inmutable de sus operaciones.
                </p>

                <div style="
                    background: rgba(0, 0, 0, 0.28);
                    border-left: 2px solid rgba(212, 185, 110, 0.3);
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    border-right: 1px solid rgba(255, 255, 255, 0.05);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 0.875rem 1rem;
                    margin: 0 0 2rem;
                ">
                    <p style="
                        color: #5F7290;
                        font-size: 0.78rem;
                        margin: 0;
                        line-height: 1.6;
                        font-family: var(--font-mono, 'Courier New', monospace);
                        letter-spacing: 0.02em;
                        text-decoration: none;
                    " data-i18n="legal.disclaimer">
                        ADVERTENCIA: Todas las interacciones dentro de este perímetro están sujetas a auditoría criptográfica bajo normativas KYC/AML y reportes regulatorios jurisdiccionales.
                    </p>
                </div>

                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button id="btn-legal-reject" style="
                        background: transparent;
                        color: #5F7290;
                        border: 1px solid rgba(95, 114, 144, 0.35);
                        padding: 0.65rem 1.4rem;
                        cursor: pointer;
                        font-size: 0.825rem;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                        transition: border-color 0.2s, color 0.2s;
                    " data-i18n="legal.action.reject">
                        Rechazar y Salir
                    </button>
                    <button id="btn-legal-accept" style="
                        background: var(--stitch-gold, #D4B96E);
                        color: #09101E;
                        border: none;
                        padding: 0.65rem 1.75rem;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 0.825rem;
                        letter-spacing: 0.06em;
                        text-transform: uppercase;
                        transition: opacity 0.2s;
                    " data-i18n="legal.action.accept">
                        Aceptar Términos
                    </button>
                </div>
            </div>
        `;

        // 2. Captura de referencias a nodos dinámicos
        this._btnReject = this.querySelector('#btn-legal-reject');
        this._btnAccept = this.querySelector('#btn-legal-accept');

        // 3. Vinculación de Intents Fiduciarios (Eventos)
        this._btnReject.addEventListener('click', () => this.dispatch('LEGAL_REJECTED'));
        this._btnAccept.addEventListener('click', () => this.dispatch('LEGAL_ACCEPTED'));

        // 4. Activación de la reactividad (Vital invocar al padre)
        super.connectedCallback();
    }

    stateChanged(state) {
        // Extracción estricta del vector de bloqueo
        const isLocked = state?.system?.isLocked === true;

        // Mutación DOM granular: Modificar solo estado de interacción
        if (this._btnAccept) {
            this._btnAccept.disabled = isLocked;
            this._btnAccept.style.opacity = isLocked ? '0.5' : '1';
            this._btnAccept.style.cursor = isLocked ? 'not-allowed' : 'pointer';
        }

        if (this._btnReject) {
            this._btnReject.disabled = isLocked;
            this._btnReject.style.opacity = isLocked ? '0.5' : '1';
            this._btnReject.style.cursor = isLocked ? 'not-allowed' : 'pointer';
        }
    }
}

// Autoregistro transitorio hasta la Forja del Registry Central (E5-T16)
customElements.define('aip-legal-attestation', AipLegalAttestation);
