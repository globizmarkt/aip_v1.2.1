import { test, describe, before } from 'node:test';
import assert from 'node:assert';

// [P8-TL-01] Mocks de Browser API para Node.js (Zero-Deps)
// El core (app-fsm, app-store) es JS puro, pero necesitan globals del navegador.
before(() => {
    if (typeof globalThis.window === 'undefined') {
        const noop = () => {};
        const nullMock = () => null;
        const emptyArr = () => [];

        globalThis.window = globalThis;
        globalThis.document = {
            getElementById: nullMock,
            querySelector: nullMock,
            querySelectorAll: emptyArr,
            addEventListener: noop,
            removeEventListener: noop,
            dispatchEvent: noop,
            createDocumentFragment: () => ({ appendChild: noop }),
            createElement: () => ({
                setAttribute: noop,
                appendChild: noop,
                classList: { add: noop, remove: noop, toggle: () => false, contains: () => false },
                style: {},
                textContent: ''
            }),
        };
        globalThis.CustomEvent = class {
            constructor(n, o) { this.type = n; this.detail = o?.detail; this.bubbles = o?.bubbles; }
        };
        globalThis.localStorage = { getItem: () => null, setItem: noop };
        globalThis.sessionStorage = { getItem: () => null, setItem: noop, removeItem: noop };
        globalThis.location = { hostname: 'localhost' };

        // Silenciar ruido de consola en asserts de transiciones
        globalThis.console.warn = noop;
        globalThis.console.log = noop;
    }
});

describe('Smoke Tests - P8-TL-01 (Provisional node:test)', () => {
    let UserFSM, readState, onStateChange;

    // Importación dinámica para asegurar que los mocks están listos
    // antes de que app-fsm.js ejecute su root-level (claimWriteCapability).
    before(async () => {
        const fsmModule = await import('../src/01-core/app-fsm.js');
        UserFSM = fsmModule.UserFSM;

        const storeModule = await import('../src/01-core/app-store.js');
        readState = storeModule.readState;
        onStateChange = storeModule.onStateChange;
    });

    test('1. Boot sin crash — FSM inicializa en BOOT_SEQUENCE', () => {
        assert.strictEqual(UserFSM.getMachineState(), 'BOOT_SEQUENCE', 'FSM no arrancó en estado inicial');
    });

    test('2. FSM transita — NO_SESSION_FOUND lleva a ORBIT_1_GUEST', () => {
        UserFSM.send('NO_SESSION_FOUND');
        assert.strictEqual(UserFSM.getMachineState(), 'ORBIT_1_GUEST', 'Transición básica falló');
    });

    test('3. Store notifica — Suscriptor recibe snapshot tras LOGIN_SUBMITTED', (t, done) => {
        const unsubscribe = onStateChange((snapshot) => {
            try {
                assert.ok(snapshot, 'Snapshot no recibido');
                assert.strictEqual(snapshot.ui.fsmState, 'ORBIT_2_GATEKEEPER', 'Store no reflejó estado FSM');
                unsubscribe();
                done();
            } catch (err) {
                done(err);
            }
        });

        UserFSM.send('LOGIN_SUBMITTED');
    });

    // -----------------------------------------------------------------
    // NOTA DE EXCLUSIÓN (AIPHandler.js)
    // No se testea AIPHandler.js en este runner por 2 bloqueantes restantes:
    // 1. Importa `firebase/auth` (SDK cliente) vía dynamic import.
    //    Este package no está en node_modules del backend.
    // 2. Asume estado DOM completo (event listeners en ids específicos).
    //    Mockearlo requiere `jsdom` (violación "cero dependencias nuevas").
    // 3. RESUELTO 2026-07-09 (ADM-DUAL-FSM-01, Opción A aplicada) — AIPHandler.js
    //    ya importa `app-fsm.js` (el mismo FSM que testea este archivo, líneas
    //    arriba). `userFSM.js` eliminado del disco. Split-brain cerrado.
    //
    // Resolución (1+2): Evaluar en Bloque B o al resolver CCD-P30
    // (migración a Vitest, que soporta jsdom y modulo mocking de forma nativa).
    // -----------------------------------------------------------------
});
