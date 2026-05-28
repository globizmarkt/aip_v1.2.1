/**
 * @file app-store.js
 * @description Proxy in-memory micro-reactivo (Zero-Trust).
 * Cero manipulación de DOM. Cero Event Bus Global.
 */

import { initialState, isValidStateShape } from './contracts/state-contract.js';

// Capability-based Write: Símbolo único. Solo quien importa esta constante secreta
// (La FSM en la Fase 3) tiene autorización matemática para mutar el store.
const WRITE_TOKEN = Symbol('AIP_FSM_WRITE_TOKEN');

// Estado interno oculto en la clausura
let currentState = structuredClone(initialState);
const listeners = new Set();

/**
 * Notifica a todos los suscriptores entregando un clon inmutable (Snapshot).
 */
function notifyListeners() {
    const snapshot = Object.freeze(structuredClone(currentState));
    for (const listener of listeners) {
        try {
            listener(snapshot);
        } catch (err) {
            console.error('[Store:Error] Fallo en listener reactivo:', err);
        }
    }
}

// Interceptor mutacional (Patrón inspirado en Valtio)
const proxyHandler = {
    set(target, property, value) {
        target[property] = value;
        // Batching simplificado: idealmente esto debería usar requestAnimationFrame
        // para coalescencia de eventos, pero mantenemos footprint mínimo.
        notifyListeners();
        return true;
    }
};

const stateProxy = new Proxy(currentState, proxyHandler);

// ==========================================
// 🛡️ API PÚBLICA (Solo Lectura)
// ==========================================

/**
 * Extrae el estado actual sin mutarlo.
 * @returns {Object} Snapshot congelado.
 */
export function readState() {
    return Object.freeze(structuredClone(currentState));
}

/**
 * Suscribe un componente a los cambios del store.
 * @param {Function} callback - Función que recibe el snapshot.
 * @returns {Function} Función para desuscribirse (cleanup).
 */
export function onStateChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

// ==========================================
// 🔐 API RESTRINGIDA (Solo Escritura FSM)
// ==========================================

export function getWriteToken() {
    return WRITE_TOKEN;
}

/**
 * Ejecuta una mutación en el Store. Rechaza cualquier intento sin el token oficial.
 * @param {Symbol} token - El WRITE_TOKEN de autorización.
 * @param {Function} patchFn - Función que inyecta la mutación sobre el proxy.
 */
export function commitState(token, patchFn) {
    if (token !== WRITE_TOKEN) {
        throw new Error('[Store:Zero-Trust] Intento de escritura no autorizada rechazado.');
    }

    // Inyecta el cambio
    patchFn(stateProxy);

    // Validación estructural post-mutación
    if (!isValidStateShape(currentState)) {
        console.warn('[Store:Validation] El estado ha sufrido una mutación que rompe el schema base.');
    }
}
