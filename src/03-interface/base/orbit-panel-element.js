/**
 * ARCHIVO: orbit-panel-element.js
 * VERSIÓN: 1.1.0
 * FECHA: 2026-06-15
 * PROPÓSITO: Molde mínimo viable para paneles de Órbita 4 (AIP CRM). Extrae el
 *            boilerplate duplicado entre `aip-account-config.js` y
 *            `aip-superadmin-kyc.js`: helper de creación de nodos `_c()`,
 *            dispatch de hidratación, lectura de `users/{uid}` y gate de rol.
 *            Forja [N-34] (yacimiento SDD-gadgets), V-2/V-3 de
 *            `.claude/PROPUESTAS_AGENTE.md` Bloque V (R-GADGET-01: cero
 *            riesgo visual, solo infraestructura JS).
 * ÍNDICE:
 *   [SEC-01] Configuración y Constantes
 *   [SEC-02] Helper de creación de nodos — _c()
 *   [SEC-03] Clase OrbitPanelElement extends ReactiveElement — AMPLIADA:
 *     añadido _hasRole(userDoc, role) (V-3, acreción)
 *   [SEC-04] Exports
 *
 * NOTA R-GADGET-01.1: esta es una clase base abstracta sin
 * `customElements.define` propio (no es un gadget registrable por sí misma) —
 * puntos 5/6 del checklist no aplican a este archivo, solo a sus herederos.
 *
 * /laparoscopia 2026-06-15: añadido _hasRole(userDoc, role) — V-3 de
 * .claude/PROPUESTAS_AGENTE.md Bloque V, 3er caso de uso real (gate
 * 'superadmin' en dos componentes + gate 'agente' nuevo en
 * aip-agent-desktop.js). Sin cambios de comportamiento previo.
 */

import { ReactiveElement } from './reactive-element.js';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// [SEC-01] Configuración y Constantes
// (sin constantes propias — el molde es deliberadamente mínimo)

// [SEC-02] Helper de creación de nodos
export function _c(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        switch (k) {
            case 'className': el.className = v; break;
            case 'textContent': el.textContent = v; break;
            case 'type': el.type = v; break;
            case 'name': el.name = v; break;
            case 'value': el.value = v; break;
            case 'disabled': el.disabled = v; break;
            case 'readOnly': el.readOnly = v; break;
            case 'htmlFor': el.htmlFor = v; break;
            case 'src': el.src = v; break;
            default: if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? '' : v);
        }
    }
    for (const child of children) {
        if (child instanceof Node) el.appendChild(child);
        else if (child !== null && child !== undefined) el.appendChild(document.createTextNode(String(child)));
    }
    return el;
}

// [SEC-03] Clase OrbitPanelElement
export class OrbitPanelElement extends ReactiveElement {
    /**
     * Dispatch estándar de hidratación tras _render().
     * @param {string} source - nombre del custom element (p.ej. 'aip-account-config').
     */
    _hydrated(source) {
        this.dispatchEvent(new CustomEvent('Skeleton:DOM:Hydrated', { bubbles: true, detail: { source } }));
    }

    /**
     * Lectura de users/{uid}. Devuelve los datos del documento o null si no existe.
     * @param {string} uid
     * @returns {Promise<Object|null>}
     */
    async _fetchUserDoc(uid) {
        const db = getFirestore();
        const snap = await getDoc(doc(db, 'users', uid));
        return snap.exists() ? snap.data() : null;
    }

    /**
     * Gate de rol genérico — compara el campo `rol` de un documento de
     * usuario (p.ej. obtenido vía _fetchUserDoc) contra el rol esperado.
     * @param {Object|null} userDoc
     * @param {string} role
     * @returns {boolean}
     */
    _hasRole(userDoc, role) {
        return userDoc?.rol === role;
    }
}

// [SEC-04] Exports — ver `export` inline arriba (_c, OrbitPanelElement)
