// ============================================================
// ARCHIVO  : AnonProjectState.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-24
// PROPÓSITO: Schema y factoría del estado de proyecto anónimo en gestación (la Mochila).
//            Contrato de datos inmutable para visitantes pre-KYC (Clearance: ANÓNIMO).
//            Fuente de verdad: DOMAIN_BLUEPRINT_01.md §1.1 (Privilegio Progresivo) + §1.2 (Ciclo Proyecto).
// ============================================================
// ÉPICA    : E3 — Onboarding Spine
// TICKET   : E3-T00
// AGENTE   : Claude Code
// DOCTRINA : R27 (Immutabilidad recursiva) · R18 (ES Modules) · R11 (Nomenclatura fiduciaria)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Enumeraciones y constantes del dominio
// [SEC-03] Schema base (AnonProjectSchema — congelado R27)
// [SEC-04] Factoría de estado (createEmptyState)
// [SEC-05] Exports

// ============================================================
// [SEC-01] Importaciones y dependencias
// ============================================================

import { deepFreeze } from '../utils/deepFreeze.js';

// ============================================================
// [SEC-02] Enumeraciones y constantes del dominio
// ============================================================

/**
 * Los 5 estados del ciclo de vida de un proyecto fiduciario.
 * Fuente: DOMAIN_BLUEPRINT_01.md §1.2 — inmutables, no reordenar.
 */
export const FIDUCIARY_STATES = deepFreeze([
    'GESTATION',   // Borrador anónimo — sin KYC
    'EMBRYONIC',   // KYC Tier 1 completado — BRONZE
    'MATURATION',  // Due Diligence en curso — SILVER
    'QUALIFIED',   // IntegrityScore ≥ 80 — GOLD
    'EXECUTED',    // Deal cerrado — PLATINUM / sellado
]);

export const DEFAULT_STATE = 'GESTATION';

// ============================================================
// [SEC-03] Schema base (AnonProjectSchema — congelado R27)
// ============================================================

/**
 * Contrato de forma del estado de proyecto anónimo.
 * Representa la mochila mínima de un visitante antes del primer KYC.
 * Congelado via deepFreeze (R27) — inmutable en runtime.
 *
 * IMPORTANTE: Este objeto define el SHAPE, no es una instancia mutable.
 * Para crear instancias frescas usar createEmptyState().
 */
export const AnonProjectSchema = deepFreeze({

    /** UUID v4 del proyecto — null hasta que sessionGC o GenesisWizard lo asignen */
    project_id: null,

    /** UID del propietario autenticado — null mientras sea visitante anónimo */
    owner_uid: null,

    /** Estado en el ciclo de vida fiduciario. Ver FIDUCIARY_STATES. */
    fiduciary_state: DEFAULT_STATE,

    /** Puntuación de bancabilidad (0-100). Motor: IntegrityEngine.js (DT-INTEGRITY-01). */
    integrity_score: 0,

    /** Intención de activo declarada por el visitante en el Acto I del Event Storming. */
    asset_intent: {
        category: null,   // Ej: 'ADVISORY' | 'ASSET' | 'TRADE_FINANCE'
        quantity: null,   // Valor numérico del activo
        currency: null,   // ISO 4217 — Ej: 'USD' | 'EUR' | 'CHF'
    },

    /** Ledger de auditoría inmutable. R22 extendida: cada entrada requiere agent_type + human_override. */
    compliance_ledger: [],

    /** Unix timestamp (ms) de creación — asignado por createEmptyState(). */
    created_at: 0,

    /** Unix timestamp (ms) de última modificación — actualizar en cada mutación de estado. */
    last_updated: 0,

    /** Idioma activo del visitante al instanciar la Mochila. ISO 639-1. */
    locale: 'en',
});

// ============================================================
// [SEC-04] Factoría de estado (createEmptyState)
// ============================================================

/**
 * Genera una nueva instancia mutable del estado de proyecto anónimo.
 * Los timestamps se resuelven al momento de la llamada.
 * La instancia resultante NO está congelada — puede ser modificada
 * por GenesisWizard.js conforme el visitante avanza en el Acto I.
 *
 * @returns {Object} Estado inicial de la Mochila con timestamps actuales.
 */
export function createEmptyState() {
    const now = Date.now();
    return {
        project_id: null,
        owner_uid: null,
        fiduciary_state: DEFAULT_STATE,
        integrity_score: 0,
        asset_intent: {
            category: null,
            quantity: null,
            currency: null,
        },
        compliance_ledger: [],
        created_at: now,
        last_updated: now,
        locale: localStorage.getItem('skeleton_lang') || 'en',
    };
}

// ============================================================
// [SEC-05] Exports
// ============================================================

// Named exports: AnonProjectSchema · FIDUCIARY_STATES · DEFAULT_STATE · createEmptyState
// (todos declarados con export inline arriba)
