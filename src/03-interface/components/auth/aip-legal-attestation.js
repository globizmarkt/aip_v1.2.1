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
            <div class="luxury-glass" style="
                background-color: var(--crm-bg-surface, #0F1117);
                border: 1px solid var(--crm-border-subtle, rgba(255,255,255,0.08));
                padding: 2.5rem;
                border-radius: 0;
                width: 100%;
                max-width: 560px;
                box-sizing: border-box;
                font-family: system-ui, sans-serif;
            ">
                <h2 style="
                    color: var(--stitch-gold, #D4B96E);
                    margin-top: 0;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                    letter-spacing: 0.01em;
                " data-i18n="legal.title">
                    Atestación Fiduciaria Institucional
                </h2>

                <p style="
                    color: var(--crm-text-secondary, #A0AABF);
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                " data-i18n="legal.description">
                    Al acceder a la Órbita 3 del sistema, usted acepta los términos de intermediación institucional, la política de custodia de activos y la trazabilidad inmutable de sus operaciones.
                </p>

                <div style="
                    background-color: var(--crm-bg-canvas, #0C0F14);
                    border: 1px solid var(--crm-border, rgba(255,255,255,0.12));
                    padding: 1rem;
                    border-radius: 0;
                    margin-bottom: 2rem;
                ">
                    <p style="
                        color: var(--crm-text-secondary, rgba(160,170,191,0.7));
                        font-size: 0.85rem;
                        margin: 0;
                        line-height: 1.5;
                    " data-i18n="legal.disclaimer">
                        ADVERTENCIA: Todas las interacciones dentro de este perímetro están sujetas a auditoría criptográfica bajo normativas KYC/AML y reportes regulatorios jurisdiccionales.
                    </p>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="btn-legal-reject" style="
                        background: transparent;
                        color: var(--crm-text-primary, #E8EDF5);
                        border: 1px solid var(--crm-border, rgba(255,255,255,0.2));
                        padding: 0.75rem 1.5rem;
                        border-radius: 2px;
                        cursor: pointer;
                        transition: opacity 0.2s;
                        font-size: 0.9rem;
                    " data-i18n="legal.action.reject">
                        Rechazar y Salir
                    </button>
                    <button id="btn-legal-accept" style="
                        background-color: var(--stitch-gold, #D4B96E);
                        color: #0B1A2A;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 2px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: opacity 0.2s;
                        font-size: 0.9rem;
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
