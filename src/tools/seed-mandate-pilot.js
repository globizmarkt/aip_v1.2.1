// ============================================================
// ARCHIVO  : seed-mandate-pilot.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-24
// PROPÓSITO: Seed script — inserta MND-2026-06-24-0001 (Gold Bullion SCO)
//            en Firestore colección `mandates/`. Ejecución única por el
//            Director desde la raíz del proyecto con ADC activo.
//            Trazabilidad: INV-FORJA9-01 · DOMAIN_BLUEPRINT [SEC-05]
// ============================================================

// ÍNDICE
// [SEC-01] Imports e inicialización
// [SEC-02] Documento mandato piloto (Gold Bullion SCO)
// [SEC-03] Ejecución del seed

// ─────────────────────────────────────────────────────────────
// [SEC-01] Imports e inicialización
// ─────────────────────────────────────────────────────────────

// Requiere: node seed-mandate-pilot.js
// Desde:    C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\
// Pre:      firebase login (ADC activo) + firebase use <project-id>
// Deps:     npm install (en functions/) ya instaló firebase-admin

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, Timestamp }           = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });

const db = getFirestore();

// ─────────────────────────────────────────────────────────────
// [SEC-02] Documento mandato piloto — Gold Bullion SCO
//
// Schema: DOMAIN_BLUEPRINT_SYNTHESIS.md [SEC-05]
//         campos mínimos + suplemento Metals
// Fuente: mockState.js MANDATE_004 + SCO_Bullion_UK_Switzerland_Dubai_HongKong_06_01_2026.pdf
// Estado fiduciario: 'Qualified' — visible para inversores ≥ IS 75 / KYC Tier 2
// ─────────────────────────────────────────────────────────────

const MANDATE_ID = 'MND-2026-06-24-0001';

const mandatePilot = {
  // ── Campos mínimos obligatorios [SEC-05] ──────────────────

  mandateId:      MANDATE_ID,
  createdAt:      Timestamp.fromDate(new Date('2026-01-06T00:00:00Z')),  // SCO emitido
  updatedAt:      Timestamp.fromDate(new Date('2026-06-24T00:00:00Z')),
  version:        1,
  type:           'Asset',

  purpose: 'Intermediación mandato de venta Gold Bullion SCO · 15,000 MT · ' +
           'Bank to Bank / Ledger to Ledger · Precio 12/9 LBMA spot.',

  asset: {
    class:          'Metals',
    description:    'Gold Bullion Non-GLD · pureza ≥ 99.95% (999.5/1000) · ' +
                    'Hallmark internacional reconocido · lingotes 1 KG / 12.5 KG · ' +
                    'origen certificado sin origen criminal · antigüedad < 5 años',
    currency:       'USD',
    // estimatedValue: dinámico — precio LBMA spot × volumen. No hardcodeado.
    // A ~$3,285/oz LBMA y 12/9 under: precio aprox $2,891/oz → $44B para 15,000 MT
    // Dejar null hasta que el Director confirme el rango de valor a mostrar.
    estimatedValue: null,
  },

  fiduciaryState: 'Qualified',   // visible en matching (IS ≥ 75, KYC Tier 2)
  locked:         false,
  originatorId:   'AIP_COMMODITIES_DESK',  // ver CENSUS_AGENTES si aplica

  // ── Suplemento Metals ─────────────────────────────────────

  asset_quantity: 15000,
  asset_unit:     'tonnes',
  ticker_label:   'XAU/USD',

  // ── Suplemento counterparties ─────────────────────────────

  counterparties: [
    'Vendedor institucional — identidad bajo NDA (CH/UK/AE/HK)',
  ],

  // ── Suplemento compliance ─────────────────────────────────

  compliance: {
    kycStatus:               'tier2_active',
    amlStatus:               'pending',
    integrityScoreAtCreation: null,  // asignar manualmente con SYS-ADMIN-IS-01
  },

  // ── Suplemento deal metadata ──────────────────────────────

  dealType:       'Bank to Bank · Ledger to Ledger · FOB',
  locations:      ['London', 'Zurich', 'Dubai', 'Hong Kong'],
  priceStructure: '12/9 bajo cotización LBMA spot',
  barSizes:       ['1 KG', '12.5 KG'],
  purityMin:      '99.95%',  // 999.5/1000

  // SCO Transaction Procedure (7 pasos) — fuente: SCO PDF 2026-01-06
  scoSteps: [
    { step: 1, phase: 'Documentación Inicial',
      summary: 'LOI + CIS + POF del comprador. Vendedor entrega FCO firmado + SPA con NCNDA/IMFPA.' },
    { step: 2, phase: 'Verificación Bancaria y Garantías',
      summary: 'Bank Officers intercambian Proof of Funds (comprador) y MT600 Proof of Product (vendedor).' },
    { step: 3, phase: 'Validación SKR con Banco Custodio',
      summary: 'Comprador verifica SKR directamente con banco custodio del oro.' },
    { step: 4, phase: 'Pago Bank-to-Bank',
      summary: 'Comprador ejecuta MT103 por primera tranche una vez verificado el oro.' },
    { step: 5, phase: 'Transferencia de Título',
      summary: 'Vendedor libera barras + documentación custodia + SKR a nombre del comprador.' },
    { step: 6, phase: 'Entrega / Retiro',
      summary: 'Comprador decide: mantener en vault o transportar bajo logística certificada.' },
    { step: 7, phase: 'Comisiones — NCNDA/IMFPA',
      summary: 'Comisiones pagadas por vendedor a cada Paymaster/Beneficiario tras cada tranche.' },
  ],

  // ── Documentos referenciados (pendiente subida) ───────────

  documents: [],  // se actualizará con aip-uploader una vez disponible el SKR o FCO

  parentMandateId: null,

  // ── Compatibilidad con mockState (bridge transitorio) ─────
  // Mientras la electrificación CRM no esté completa, el CRM sigue
  // leyendo de mockState. Este campo permite el puente:
  //   ignition-v13.js §X puede hacer: if (mandate.legacyId) → mockState lookup

  legacyId: 'AIP-M-2026-004',
};

// ─────────────────────────────────────────────────────────────
// [SEC-03] Ejecución del seed
// ─────────────────────────────────────────────────────────────

async function seed() {
  const ref = db.doc(`mandates/${MANDATE_ID}`);
  const existing = await ref.get();

  if (existing.exists) {
    console.log(`[SKIP] Mandato ${MANDATE_ID} ya existe en Firestore. Use --force para sobreescribir.`);
    process.exit(0);
  }

  await ref.set(mandatePilot);
  console.log(`[OK] Mandato ${MANDATE_ID} insertado en mandates/${MANDATE_ID}`);
  console.log(`     type: ${mandatePilot.type} · fiduciaryState: ${mandatePilot.fiduciaryState}`);
  console.log(`     asset: ${mandatePilot.asset.class} · ${mandatePilot.asset_quantity} ${mandatePilot.asset_unit}`);
  console.log('');
  console.log('SIGUIENTE PASO → SYS-ADMIN-IS-01: asignar integrityScoreAtCreation desde panel admin.');
}

seed().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
