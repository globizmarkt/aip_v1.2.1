/**
 * @file reactive-element.js
 * @description Clase base abstracta para Web Components del ecosistema AIP v1.3.
 * Conecta el DOM reactivo con la FSM y el Store bajo modelo Zero-Trust.
 *
 * Doctrina R2 (Light DOM Estricto): Prohibido attachShadow().
 * Doctrina R0 (Zero-Trust): Escritura solo vía UserFSM.send() — nunca directa al store.
 * Gestión de memoria: suscripción limpiada en disconnectedCallback (cero memory leaks).
 */

import { readState, onStateChange } from '../../01-core/app-store.js';
import { UserFSM } from '../../01-core/app-fsm.js';

export class ReactiveElement extends HTMLElement {
    constructor() {
        super();
        this._unsubscribe = null;
    }

    connectedCallback() {
        // Suscripción al estado inmutable
        this._unsubscribe = onStateChange((newState) => {
            this.stateChanged(newState);
        });

        // Hidratación inicial forzada con snapshot actual
        this.stateChanged(readState());
    }

    disconnectedCallback() {
        // Erradicación de memory leaks — limpieza garantizada
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
    }

    /**
     * Método abstracto para inyección de estado en la UI.
     * Cada componente heredero implementa su propio render.
     * @param {Object} state - Snapshot inmutable del estado global.
     */
    stateChanged(state) {
        // A implementar por el componente heredero
    }

    /**
     * Enrutador fiduciario para eventos de usuario.
     * Única vía autorizada para solicitar transiciones de estado.
     * Encapsula UserFSM.send() — los componentes nunca llaman a la FSM directamente.
     * @param {string} eventName - Evento topológico FSM (ej. 'LEGAL_ACCEPTED').
     * @param {Object} payload   - Datos del evento.
     */
    dispatch(eventName, payload = {}) {
        UserFSM.send(eventName, payload);
    }
}
