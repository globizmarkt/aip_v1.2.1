/**
 * @file app-store.js
 * @description Proxy in-memory micro-reactivo (Zero-Trust Real).
 * Cero manipulación de DOM. Cero Event Bus Global.
 *
 * SECURITY: Claim Único — la capacidad de escritura solo puede ser reclamada
 * una vez en el ciclo de vida de la aplicación (claimWriteCapability).
 * Sutura R0: Override Sentinel 2026-05-28.
 */

import { initialState, isValidStateShape } from './contracts/state-contract.js';

let currentState = structuredClone(initialState);
const listeners = new Set();
let writeCapabilityDelivered = false;
// [PERF-STORE-01] Caché del último snapshot: elimina structuredClone redundantes
// en readState() y evita re-renders post-mount sin nuevo commit.
let _cachedSnapshot = null;

function notifyListeners() {
    _cachedSnapshot = Object.freeze(structuredClone(currentState));
    for (const listener of listeners) {
        try { listener(_cachedSnapshot); }
        catch (err) { console.error('[Store:Error]', err); }
    }
}

// [PERF-STORE-02] El proxy ya no notifica en cada set individual.
// Notification exclusiva de commitState → 1 notify por commit (no N por N propiedades).
// Zero-Trust preservado: solo commitState (claim único) puede escribir en stateProxy.
const proxyHandler = {
    set(target, property, value) {
        target[property] = value;
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
    // [PERF-STORE-01] Retorna el snapshot cacheado si está disponible — cero clones extra.
    return _cachedSnapshot ?? Object.freeze(structuredClone(currentState));
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
// 🔐 API RESTRINGIDA (Claim Único Zero-Trust)
// ==========================================

/**
 * Entrega la capacidad de mutación (commit) UNA SOLA VEZ.
 * El FSM debe reclamar esto en su fase de boot. Cualquier intento posterior
 * lanzará un error crítico de seguridad.
 *
 * CONTRATO DOCTRINAL: el llamador (FSM) debe usar Top-Level Replacements
 * para que el proxy capture la asignación. notifyListeners() se dispara UNA VEZ
 * al final de commitState — no por propiedad (PERF-STORE-02). Ejemplo correcto:
 *   commit(proxy => { proxy.auth = { ...proxy.auth, isAuthenticated: true }; })
 * Ejemplo incorrecto (mutación profunda silenciosa — no notificará listeners):
 *   commit(proxy => { proxy.auth.isAuthenticated = true; })
 *
 * @returns {Function} commitState(patchFn)
 */
export function claimWriteCapability() {
    if (writeCapabilityDelivered) {
        throw new Error('[Store:Zero-Trust] Violación Crítica: Capacidad de escritura ya reclamada.');
    }

    writeCapabilityDelivered = true;
    console.log('[Store:Security] Capacidad de escritura fiduciaria reclamada y bloqueada.');

    return function commitState(patchFn) {
        patchFn(stateProxy);

        if (!isValidStateShape(currentState)) {
            console.error('[Store:Validation] ESTADO CORRUPTO: Ruptura del schema base.');
        }

        // [PERF-STORE-02] Notificación única post-commit — no por propiedad.
        notifyListeners();
    };
}
