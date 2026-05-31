// ============================================================
// ARCHIVO  : mockState.js
// VERSIÓN  : 1.1.0
// FECHA    : 2026-05-31 (v1.1.0 — SEC-06 CATEGORIES + SEC-07 DOCUMENTS añadidos)
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
// [SEC-06] Datos mock — CATEGORIES (Nodos L2 del árbol CRM)
//   [SEC-06-PILOT] Metales & Minería — datos reales (cuestionarios de viabilidad)
//   [SEC-06-STUBS] Energía & Derivados, Agrícola & Soft, M&A subcategorías, AIP Ventures
// [SEC-07] Datos mock — DOCUMENTS_REGISTRY (documentos descargables)
//   [SEC-07-METALES] Protocolo Compliance + Cuestionarios Al/Cu/Au
//
// Contrato canónico: DOMAIN_BLUEPRINT_05_L2_NODE_CONTRACT.md

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

// [SEC-03-D] Mandate AIP-M-2026-004 — Gold Bullion SCO (EVALUACIÓN · Bank to Bank)
// Fuente: SCO_Bullion_UK_Switzerland_Dubai_HongKong_06_01_2026.pdf
// CRM-TREE-03 sprint · 2026-05-31
const MANDATE_004 = {
  mandateId:      'AIP-M-2026-004',
  type:           'Asset',
  locked:         false,

  parties: {
    originator:     'AIP Commodities Desk',
    client:         '— Pendiente de identificar (comprador cualificado)',
    counterparties: ['Vendedor institucional — identidad bajo NDA (CH/UK/AE/HK)'],
  },

  asset: {
    class:          'Gold Bullion (Au)',
    spec:           'Non-GLD Standard · 99.95% mín (999.5/1000) · Hallmark int. reconocido',
    quantity:       '15,000 MT con Rolls & Extensions',
    estimatedValue: null,              // Precio dinámico: 12/9 bajo LBMA spot (~$3,285/oz)
    currency:       'USD',
    incoterm:       'FOB',
    trialLot:       'A definir — primera tranche por confirmar',
    barSize:        '1 KG / 12.5 KG lingotes',
    purity:         '99.95% mínimo (999.5/1000) o superior',
    origin:         'No criminal — certificado',
    ageAsset:       'Menos de 5 años',
    priceStructure: '12/9 bajo cotización LBMA spot',
    locations:      'London · Zurich · Dubai · Hong Kong',
    dealType:       'Bank to Bank o Ledger to Ledger',
  },

  compliance: {
    kycTier:         2,
    amlClear:        false,
    sanctionsCheck:  false,
    ncndaSigned:     true,
    sgsCertificate:  '— Pendiente verificación con banco custodio',
    sblcProvider:    '— B2B / MT600 Proof of Product',
    sblcAmount:      'MT103 primera tranche — importe a definir',
  },

  timeline: {
    created:       '2026-01-06',
    lastActivity:  '2026-05-31',
    targetClose:   'TBD — pendiente comprador cualificado',
    nextMilestone: 'Verificación SKR con banco custodio (paso 3 del SCO)',
  },

  fiduciaryState: 'EVALUACIÓN',

  // Procedimiento de transacción del SCO (7 pasos)
  // Fuente directa: SCO_Bullion_UK_Switzerland_Dubai_HongKong_06_01_2026.pdf
  scoTransactionProcedure: [
    {
      step:  1, phase: 'Documentación Inicial',
      buyer: 'LOI + CIS + POF o Autorización de verificación de fondos',
      seller: 'FCO firmado · SPA para firma y sello con NCNDA/IMFPA',
    },
    {
      step:  2, phase: 'Verificación Bancaria y Garantías de Pago',
      detail: 'Comprador instruye a su Bank Officer a proveer Proof of Funds al Bank Officer del Vendedor a cambio del Proof of Product (MT600). Los Bank Officers confirman que el comprador tiene fondos suficientes y el vendedor tiene los SKRs verificados.',
    },
    {
      step:  3, phase: 'Validación con Banco Custodio — Autorización SKR',
      detail: 'El Comprador recibe la autorización requerida para verificar el SKR y toda la documentación directamente con el Banco Custodio del oro, en su condición de Comprador.',
    },
    {
      step:  4, phase: 'Pago Bank-to-Bank',
      detail: 'Una vez verificado el oro: el Comprador ejecuta el pago bancario de la primera tranche, típicamente vía MT103.',
    },
    {
      step:  5, phase: 'Transferencia de Título de Propiedad',
      detail: 'Pago verificado → Vendedor ordena la liberación. El Vendedor transfiere el Title of Ownership al Comprador: cantidad de barras correspondiente + documentación de custodia actualizada + SKR actualizado a nombre del Comprador.',
    },
    {
      step:  6, phase: 'Entrega / Retiro',
      detail: 'El Comprador decide: mantener el oro almacenado en el vault (custodio verificado) o transportarlo internacionalmente bajo cobertura logística certificada.',
    },
    {
      step:  7, phase: 'Comisiones — per NCNDA/IMFPA',
      detail: 'Las comisiones a los agentes del Vendedor y del Comprador son pagadas por el Vendedor inmediatamente y sin demora a cada Paymaster o Beneficiario designado, tras cada tranche y conforme a los Términos del NCNDA/IMFPA.',
    },
  ],

  notes: [
    'SCO emitido: Enero 2026. Operación Bank to Bank o Ledger to Ledger.',
    'Precio: 12/9 bajo cotización LBMA spot. Con XAU/USD ~$3,285/oz → precio referencial ~$2,891/oz para el comprador.',
    'Jurisdicciones activas: Reino Unido (FCA) · Suiza (FINMA) · Emiratos Árabes (DFSA) · Hong Kong (SFC).',
    'Material NON-GLD: no apto para entrega en contratos de futuros COMEX/NYMEX. Apto para transacciones OTC bilaterales certificadas.',
  ],
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

// SEC-05 → movido al final del archivo (después de SEC-06 y SEC-07)
// para evitar TDZ: CATEGORIES_DATA y DOCUMENTS_REGISTRY deben declararse antes del export.

// ─────────────────────────────────────────────────────────────
// [SEC-06] Datos mock — CATEGORIES (Nodos L2 del árbol CRM)
// Contrato: DOMAIN_BLUEPRINT_05_L2_NODE_CONTRACT.md
// ─────────────────────────────────────────────────────────────

// ── [SEC-06-PILOT] METALES & MINERÍA — datos reales ──────────
// Fuente: cuestionarios físicos de viabilidad + Protocolo Compliance
// Origen docs: C:\Users\cabal\Documents\Breeder Hub\Business plan M&A\procedimiento metales\
// CRM-CONTENT-01 — piloto completo 2026-05-31

const CATEGORY_METALES = {
  id:         'metales-mineria',
  domain:     'COMMODITIES',
  label:      'Metales & Minería',
  labelShort: 'Metales',

  procedure: {
    headline:    'Acceso a Operaciones de Metales Físicos',
    market_note: 'El mercado opera bajo cotización LME (industriales) y LBMA (preciosos). Las asignaciones físicas reales no operan bajo descuentos profundos — están reservadas a compradores con realismo de precios y capacidad logística industrial. Operamos con brokers posicionados y autorizados que entienden la diferencia entre LME + Premium y la especulación.',

    compliance_doc: 'metales-compliance',

    steps: [
      {
        order:       1,
        title:       'Revisar el Protocolo de Integridad y Cumplimiento',
        description: 'Documento transversal obligatorio antes de cualquier operación en metales. Cubre AML, sanciones internacionales, Blacklist Protocol y carácter vinculante de la información declarada.',
        kycRequired: 0,
        documents:   ['metales-compliance'],
        sla:         null,
      },
      {
        order:       2,
        title:       'Seleccionar el activo y descargar el cuestionario de viabilidad',
        description: 'Cada metal tiene su propio Cuestionario de Solicitud y Viabilidad. El cuestionario no es un simple formulario — es un instrumento de triaje que descarta expectativas improcedentes y alinea su estructura de compra con la realidad del suministro minero. Las solicitudes genéricas o con expectativas fuera de mercado son descartadas automáticamente.',
        kycRequired: 0,
        documents:   ['metales-cuestionario-aluminio', 'metales-cuestionario-cobre', 'metales-cuestionario-oro'],
        sla:         null,
      },
      {
        order:       3,
        title:       'Completar el cuestionario con precisión técnica',
        description: 'El cuestionario requiere datos técnicos específicos: tipo de producto, origen y marcas, volumetría, incoterm, instrumento financiero (DLC MT700 / SBLC MT760). Carácter vinculante: la información falsa activa el Blacklist Protocol. No "turismo industrial".',
        kycRequired: 0,
        documents:   [],
        sla:         null,
      },
      {
        order:       4,
        title:       'Enviar el cuestionario completado a AIP',
        description: 'Envíe el cuestionario firmado y sellado por email. AIP evalúa la viabilidad en 48-72h laborables. Si la solicitud cumple los criterios técnicos y financieros, se emite una Soft Corporate Offer (SCO).',
        kycRequired: 0,
        documents:   [],
        sla:         '48-72h laborables',
      },
    ],

    propose_cta: {
      label:       'Proponer una operación como vendedor o productor',
      description: 'Si representas material disponible (productor, trader o intermediario con mandato de venta), puedes iniciar el proceso como vendedor. Las oportunidades también se crean ad hoc — no es necesario esperar a que estén publicadas en el catálogo.',
      contact:     'mailto:operations@aip.com?subject=[PROPUESTA METALES] Solicitud de mandato de venta',
    },
  },

  opportunities: {
    unlock_threshold: {
      integrityScore: 75,
      kycTier:        2,
    },
    empty_state: {
      text: 'Estamos evaluando mandatos activos en metales industriales y preciosos. Tu perfil está siendo considerado para operaciones en aluminio, cobre y oro cuando se abran posiciones.',
      cta:  'Puedes proponer una operación ahora — las oportunidades en metales también se crean ad hoc.',
    },
    teasers: [
      {
        id:             'AIP-M-2026-004',
        category_label: 'Gold Bullion (Au)',
        value_range:    '15,000 MT · Precio 12/9 LBMA',
        type:           'Asset',
        status:         'En evaluación',
        dealType:       'Bank to Bank · FOB',
        locations:      'London · Zurich · Dubai · Hong Kong',
      },
    ],
    mandate_ids: ['AIP-M-2026-004'],
  },

  aimon: {
    procedure:   'El mercado de metales físicos: el filtro real no es el KYC — es el Price Reality Check. Estamos saturados de solicitudes especulativas que exigen LME -10% cuando las mineras venden a Premium. El cuestionario que tienes en pantalla separa operadores reales de brokers sin capacidad de cierre. Si puedes llenarlo con precisión técnica, tienes acceso al metal físico.',
    opportunity: 'Las posiciones activas en metales requieren garantía bancaria ejecutable. El IntegrityScore mínimo refleja eso: buscamos contrapartes que puedan estructurar un DLC MT700 o SBLC MT760, no solo intención de compra. El aluminio no se mueve sin garantía bancaria — tampoco el cobre ni el oro.',
  },
};

// ── [SEC-06-STUBS] Resto de categorías — stubs hasta contenido real ──

const CATEGORY_ENERGIA = {
  id: 'energia-derivados', domain: 'COMMODITIES',
  label: 'Energía & Derivados', labelShort: 'Energía',
  procedure: {
    headline:    'Acceso a Operaciones de Energía y Derivados',
    market_note: 'Contenido operativo en preparación.',
    compliance_doc: null,
    steps: [],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:operations@aip.com?subject=[PROPUESTA ENERGÍA]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 75, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos en energía y derivados.', cta: 'Puedes proponer una operación ad hoc.' },
    teasers: [],
    mandate_ids: ['AIP-2026-003'],
  },
  aimon: { procedure: '', opportunity: '' },
};

const CATEGORY_AGRICOLA = {
  id: 'agricola-soft', domain: 'COMMODITIES',
  label: 'Agrícola & Soft', labelShort: 'Agrícola',
  procedure: {
    headline: 'Acceso a Operaciones Agrícolas y Soft Commodities',
    market_note: 'Contenido operativo en preparación.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:operations@aip.com?subject=[PROPUESTA AGRÍCOLA]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 75, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos en agrícola y soft commodities.', cta: 'Puedes proponer una operación ad hoc.' },
    teasers: [], mandate_ids: [],
  },
  aimon: { procedure: '', opportunity: '' },
};

const CATEGORY_VENTURES_EQUITY = {
  id: 'venture-equity', domain: 'VENTURES',
  label: 'Venture Equity', labelShort: 'Equity',
  procedure: {
    headline: 'Acceso a Operaciones de Venture Equity',
    market_note: 'Contenido operativo en preparación.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:operations@aip.com?subject=[PROPUESTA VENTURES]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 75, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos de venture equity.', cta: 'Puedes proponer una operación ad hoc.' },
    teasers: [],
    mandate_ids: ['AIP-V-2026-001'],
  },
  aimon: { procedure: '', opportunity: '' },
};

/**
 * Map de categorías L2 — keyed by id.
 * Acceso: mockState.categories['commodities-metales-mineria']
 */
// Keys = category IDs del DEFAULT_TAXONOMY en aip-orbit1-tree.js (SSoT del árbol)
const CATEGORIES_DATA = {
  'metales-mineria':   CATEGORY_METALES,
  'energia-derivados': CATEGORY_ENERGIA,
  'agricola-soft':     CATEGORY_AGRICOLA,
  'venture-equity':    CATEGORY_VENTURES_EQUITY,
  // M&A y Soluciones Financieras: stubs pendientes contenido Director
};

// ─────────────────────────────────────────────────────────────
// [SEC-07] Datos mock — DOCUMENTS_REGISTRY
// Registro centralizado de documentos descargables.
// downloadUrl: null → pendiente subida CDN/Firebase Storage
// ─────────────────────────────────────────────────────────────

const DOCUMENTS_REGISTRY = {

  // ── [SEC-07-METALES] Protocolo transversal + cuestionarios por activo ──

  'metales-compliance': {
    id:          'metales-compliance',
    label:       'Protocolo de Integridad y Cumplimiento',
    type:        'protocol',
    category_id: 'metales-mineria',
    kycRequired: 0,
    downloadUrl: null,   // TODO CRM-DOCS-01: subir a Firebase Storage
    description: 'Marco de cumplimiento AML/KYC aplicable a todas las operaciones de metales. Cubre Blacklist Protocol, sanciones internacionales y carácter vinculante de la información declarada. Lectura obligatoria antes de cualquier solicitud.',
    version:     'v1.0',
    lastUpdated: '2026-05-31',
  },

  'metales-cuestionario-aluminio': {
    id:          'metales-cuestionario-aluminio',
    label:       'Cuestionario de Solicitud y Viabilidad — Aluminio (Al)',
    type:        'questionnaire',
    category_id: 'metales-mineria',
    kycRequired: 0,
    downloadUrl: null,   // TODO CRM-DOCS-01
    description: 'Triaje de viabilidad para operaciones físicas de aluminio. Cubre estructura de compra, especificación del activo (P1020/A7 · Alambrón · Billetes Extrusión), matriz logística, Price Reality Check (LME) e ingeniería financiera (DLC/SBLC). Documento vinculante para emisión de SCO.',
    version:     'v1.0',
    lastUpdated: '2026-05-31',
  },

  'metales-cuestionario-cobre': {
    id:          'metales-cuestionario-cobre',
    label:       'Cuestionario de Solicitud y Viabilidad — Cobre (Cu)',
    type:        'questionnaire',
    category_id: 'metales-mineria',
    kycRequired: 0,
    downloadUrl: null,   // TODO CRM-DOCS-01
    description: 'Triaje de viabilidad para operaciones físicas de cobre. Mismo protocolo que aluminio adaptado a especificaciones LME Cu (Grado A, Cátodos, Alambrón).',
    version:     'v1.0',
    lastUpdated: '2026-05-31',
  },

  'metales-cuestionario-oro': {
    id:          'metales-cuestionario-oro',
    label:       'Cuestionario de Solicitud y Viabilidad — Oro (Au)',
    type:        'questionnaire',
    category_id: 'metales-mineria',
    kycRequired: 0,
    downloadUrl: null,   // TODO CRM-DOCS-01
    description: 'Triaje de viabilidad para operaciones físicas de oro. Opera bajo LBMA. Exige certificación de origen y cadena de custodia. Cumplimiento AML reforzado.',
    version:     'v1.0',
    lastUpdated: '2026-05-31',
  },
};

// ─────────────────────────────────────────────────────────────
// [SEC-05] Ensamblaje y export
// (Posición al final: CATEGORIES_DATA y DOCUMENTS_REGISTRY
//  deben estar declarados antes de ser referenciados aquí)
// ─────────────────────────────────────────────────────────────

/**
 * Estado mock completo del CRM (deepFrozen — inmutable en runtime).
 *
 * Estructura:
 *   mockState.mandates[]    → Array de objetos Mandate (L3 oportunidades)
 *   mockState.ticker        → Objeto con valores de mercado
 *   mockState.categories{}  → Map de nodos L2 (procedimiento + oportunidades)
 *   mockState.documents{}   → Map de documentos descargables
 *
 * Uso:
 *   import { mockState } from './mockState.js';
 *   const { mandates, ticker, categories, documents } = mockState;
 *
 * Progressive Lock:
 *   mandate.locked === true  → fila visible, opacity 0.4, click deshabilitado
 *   mandate.locked === false → fila activa, seleccionable
 *
 * Contrato L2: DOMAIN_BLUEPRINT_05_L2_NODE_CONTRACT.md
 */
export const mockState = deepFreeze({
  mandates:   [MANDATE_001, MANDATE_002, MANDATE_003, MANDATE_004],
  ticker:     TICKER_DATA,
  categories: CATEGORIES_DATA,
  documents:  DOCUMENTS_REGISTRY,
});
