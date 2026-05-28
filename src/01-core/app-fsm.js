/**
 * @file app-fsm.js
 * @description Máquina de Estados Finitos (FSM) para AIP v1.3.
 * Único escritor autorizado del app-store.
 * R-FREEZE aplicado: MACHINE_DEF congelado profundamente (deepFreeze).
 * Topología fiduciaria restaurada: ORBIT_3_LEGAL_ATTESTATION como Peaje Legal obligatorio.
 */

import { readState, claimWriteCapability } from './app-store.js';
import { GUARDS } from './app-guards.js';
import { ACTIONS } from './app-actions.js';
import { deepFreeze } from './utils/deepFreeze.js';

// SUTURA ZERO-TRUST: Reclamar el token de escritura (Se ejecuta solo una vez al importar)
const commit = claimWriteCapability();

// Definición topológica inmutable del Grafo de Estados
const MACHINE_DEF = deepFreeze({
    initial: 'BOOT_SEQUENCE',
    states: {
        BOOT_SEQUENCE: {
            on: {
                NO_SESSION_FOUND:    { target: 'ORBIT_1_GUEST' },
                SESSION_TOKEN_FOUND: { target: 'ORBIT_2_GATEKEEPER', action: 'hydrateSession' }
            }
        },
        ORBIT_1_GUEST: {
            on: {
                LOGIN_SUBMITTED: { target: 'ORBIT_2_GATEKEEPER' }
            }
        },
        ORBIT_2_GATEKEEPER: {
            on: {
                ACCESS_GRANTED: {
                    target: 'ORBIT_3_LEGAL_ATTESTATION',
                    action: 'grantAccess',
                    guard:  'hasValidSDUIPayload'
                },
                ACCESS_DENIED: {
                    target: 'ACCESS_BLOCKED',
                    action: 'blockAccess'
                }
            }
        },
        // Peaje Legal obligatorio — ningún usuario accede al CRM sin cruzar este nodo.
        ORBIT_3_LEGAL_ATTESTATION: {
            on: {
                LEGAL_ACCEPTED: { target: 'ORBIT_3_CRM_ACTIVE' },
                LEGAL_REJECTED: { target: 'ORBIT_1_GUEST', action: 'resetSession' }
            }
        },
        ORBIT_3_CRM_ACTIVE: {
            on: {
                LOGOUT_REQUESTED: { target: 'ORBIT_1_GUEST', action: 'resetSession' },
                SESSION_EXPIRED:  { target: 'ORBIT_1_GUEST', action: 'resetSession' }
            }
        },
        ACCESS_BLOCKED: {
            on: {
                RESET_FLOW: { target: 'ORBIT_1_GUEST', action: 'resetSession' }
            }
        }
    }
});

let currentMachineState = MACHINE_DEF.initial;

export const UserFSM = {
    /**
     * @returns {string} El nodo actual del grafo.
     */
    getMachineState() {
        return currentMachineState;
    },

    /**
     * Emite un evento a la FSM para intentar una transición.
     * @param {string} eventName - Nombre del evento (ej. 'ACCESS_GRANTED')
     * @param {Object} payload   - Datos de la transición.
     */
    send(eventName, payload = {}) {
        const stateDef = MACHINE_DEF.states[currentMachineState];

        // 1. Verificar si el evento existe en el estado actual (No Leapfrogging)
        if (!stateDef?.on?.[eventName]) {
            console.warn(`[FSM] Evento ilegal '${eventName}' ignorado en estado '${currentMachineState}'`);
            return;
        }

        const transition = stateDef.on[eventName];

        // 2. Evaluar Guardas (Zero-Trust)
        if (transition.guard) {
            const guardFn = GUARDS[transition.guard];
            const snapshot = readState();
            if (guardFn && !guardFn(snapshot, payload)) {
                console.warn(`[FSM] Transición abortada: Guarda '${transition.guard}' falló.`);
                return;
            }
        }

        // 3. Ejecutar Mutación (Top-Level Replacement vía Proxy)
        if (transition.action) {
            const actionFn = ACTIONS[transition.action];
            if (actionFn) {
                commit(proxy => actionFn(proxy, payload));
            }
        }

        // 4. Consolidar Transición
        console.log(`[FSM] Transición: ${currentMachineState} -> ${transition.target}`);
        currentMachineState = transition.target;
    }
};
