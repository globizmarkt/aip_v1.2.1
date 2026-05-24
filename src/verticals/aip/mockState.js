// ============================================================
// ARCHIVO  : mockState.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-05-24
// PROPÓSITO: Estado mock del CRM — datos de demostración para
//            validación visual pre-electrificación (Épica 4 · D1)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Constantes del dominio
// [SEC-03] Datos mock — MANDATES
//   [SEC-03-A] Mandate AIP-2026-001 — EN590 CIF Rotterdam (activo / MADURACIÓN)
//   [SEC-03-B] Mandate AIP-2026-002 — stub bloqueado (GESTACIÓN)
//   [SEC-03-C] Mandate AIP-2026-003 — stub bloqueado (GESTACIÓN)
// [SEC-04] Datos mock — TICKER
// [SEC-05] Ensamblaje y export

// ─────────────────────────────────────────────────────────────
// [SEC-01] Importaciones y dependencias
// ─────────────────────────────────────────────────────────────
import { deepFreeze } from '../../01-core/utils/deepFreeze.js';

// ─────────────────────────────────────────────────────────────
// [SEC-02] Constantes del dominio
// ─────────────────────────────────────────────────────────────

/**
 * Estados fiduciarios — alineados con AnonProjectState.js y DOMAIN_BLUEPRINT_03.
 * @type {Readonly<Object>}
 */
const FIDUCIARY_STATES = Object.freeze({
  GESTACION:  'GESTACIÓN',
  EMBRIONARIO: 'EMBRIONARIO',
  MADURACION: 'MADURACIÓN',
  CUALIFICADO: 'CUALIFICADO',
  EJECUTADO:  'EJECUTADO',
});

// ─────────────────────────────────────────────────────────────
// [SEC-03] Datos mock — MANDATES
// ─────────────────────────────────────────────────────────────

// [SEC-03-A] Mandate AIP-2026-001 — EN590 CIF Rotterdam (MADURACIÓN · KYC Tier 2)
const MANDATE_001 = {
  mandateId:       'AIP-2026-001',
  type:            'Trade',
  locked:          false,

  parties: {
    originator:      'BreederHub Advisory SA',
    client:          'Iberica Commodities SL',
    counterparties:  ['Shell Trading International Ltd', 'Vitol SA'],
  },

  asset: {
    class:          'EN590 Gasoil',
    spec:           'EN590 10ppm CIF Rotterdam',
    quantity:       '500,000 MT',
    estimatedValue: 185_000_000,
    currency:       'USD',
    incoterm:       'CIF Rotterdam',
    trialLot:       '50,000 MT',
  },

  compliance: {
    kycTier:         2,
    amlClear:        true,
    sanctionsCheck:  true,
    ncndaSigned:     true,
    sgsCertificate:  'SGS-2026-NL-4412',
    sblcProvider:    'Deutsche Bank AG Frankfurt',
    sblcAmount:      '110% FOB value per lot',
  },

  timeline: {
    created:        '2026-03-01',
    targetClose:    '2026-09-30',
    lastActivity:   '2026-05-20',
    nextMilestone:  'KYC Tier 3 Due Diligence — 2026-06-15',
  },

  fiduciaryState: FIDUCIARY_STATES.MADURACION,

  notes: [
    'Trial lot (50,000 MT) confirmado por comprador. Pendiente verificación SBLC.',
    'SGS inspection schedule acordada para primer envío Rotterdam.',
    'AML clearance recibido 2026-05-10. Pendiente KYC Tier 3 contrapartes.',
  ],
};

// [SEC-03-B] Mandate AIP-2026-002 — stub bloqueado (GESTACIÓN · locked)
const MANDATE_002 = {
  mandateId:       'AIP-2026-002',
  type:            'Advisory',
  locked:          true,

  parties: {
    originator:      null,
    client:          null,
    counterparties:  [],
  },

  asset: {
    class:          null,
    spec:           null,
    quantity:       null,
    estimatedValue: null,
    currency:       null,
    incoterm:       null,
    trialLot:       null,
  },

  compliance: {
    kycTier:         1,
    amlClear:        false,
    sanctionsCheck:  false,
    ncndaSigned:     false,
    sgsCertificate:  null,
    sblcProvider:    null,
    sblcAmount:      null,
  },

  timeline: {
    created:        null,
    targetClose:    null,
    lastActivity:   null,
    nextMilestone:  null,
  },

  fiduciaryState: FIDUCIARY_STATES.GESTACION,

  notes: [],
};

// [SEC-03-C] Mandate AIP-2026-003 — stub bloqueado (GESTACIÓN · locked)
const MANDATE_003 = {
  mandateId:       'AIP-2026-003',
  type:            'Asset',
  locked:          true,

  parties: {
    originator:      null,
    client:          null,
    counterparties:  [],
  },

  asset: {
    class:          null,
    spec:           null,
    quantity:       null,
    estimatedValue: null,
    currency:       null,
    incoterm:       null,
    trialLot:       null,
  },

  compliance: {
    kycTier:         1,
    amlClear:        false,
    sanctionsCheck:  false,
    ncndaSigned:     false,
    sgsCertificate:  null,
    sblcProvider:    null,
    sblcAmount:      null,
  },

  timeline: {
    created:        null,
    targetClose:    null,
    lastActivity:   null,
    nextMilestone:  null,
  },

  fiduciaryState: FIDUCIARY_STATES.GESTACION,

  notes: [],
};

// ─────────────────────────────────────────────────────────────
// [SEC-04] Datos mock — TICKER
// ─────────────────────────────────────────────────────────────

/**
 * Ticker de mercado — valores estáticos para demo visual.
 * Electrificación real → Fase 5+ (API feeds o Firebase Functions).
 */
const TICKER_DATA = {
  xau:     '$3,285.40',   // XAU/USD — oro spot
  sofr:    '4.31%',       // SOFR — Secured Overnight Financing Rate
  eur_chf: '0.9412',      // EUR/CHF — tipo de cambio
  brent:   '$82.45',      // Brent crude (bonus — posible uso futuro)
  timestamp: '2026-05-24T09:00:00Z',
};

// ─────────────────────────────────────────────────────────────
// [SEC-05] Ensamblaje y export
// ─────────────────────────────────────────────────────────────

/**
 * Estado mock completo del CRM (deepFrozen — inmutable en runtime).
 *
 * Estructura:
 *   mockState.mandates[]  → Array de objetos Mandate
 *   mockState.ticker      → Objeto con valores de mercado
 *
 * Uso:
 *   import { mockState } from './mockState.js';
 *   const { mandates, ticker } = mockState;
 *
 * Progressive Lock:
 *   mandate.locked === true  → fila visible, opacity 0.4, click deshabilitado
 *   mandate.locked === false → fila activa, seleccionable
 */
export const mockState = deepFreeze({
  mandates: [MANDATE_001, MANDATE_002, MANDATE_003],
  ticker:   TICKER_DATA,
});
