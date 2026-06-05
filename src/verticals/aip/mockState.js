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
      contact:     'mailto:admin@breederhub.store?subject=[PROPUESTA METALES] Solicitud de mandato de venta',
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

  // [INV-AIMON-VOICE-01 · E6-T10 · 2026-06-02] Strings producción v1.0
  aimon: {
    procedure:   'El mercado de metales físicos: el filtro real no es el KYC — es el Price Reality Check. Estamos saturados de solicitudes especulativas que exigen LME -10% cuando las mineras venden a Premium. El cuestionario en pantalla separa operadores reales de brokers sin capacidad de cierre. Si puedes llenarlo con precisión técnica, tienes acceso al mercado de metal físico.',
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
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA ENERGÍA]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 75, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos en energía y derivados.', cta: 'Puedes proponer una operación ad hoc.' },
    teasers: [],
    mandate_ids: ['AIP-2026-003'],
  },
  // [INV-AIMON-VOICE-01 · E6-T10 · 2026-06-02]
  aimon: {
    procedure:   'El mercado de contratos energéticos a largo plazo opera con contrapartes soberanas y utilities de grado inversor. El cuestionario en pantalla no mide intención — mide capacidad de estructuración de PPA y tolerancia a ciclos de negociación de 18+ meses. Separamos operadores con mandato real de intermediarios sin acceso a offtaker. Si tu volumen es verificable, avanzas.',
    opportunity: 'Las posiciones en energía requieren contraparte con capacidad de firma de PPA o mandato de utility verificable. Buscamos operadores que puedan sostener un ciclo de negociación de 18 meses con documentación de grado inversor. El IntegrityScore mínimo refleja solidez de mandato. Un contrato de energía no se estructura sin offtaker confirmado — tampoco sin garantía soberana.',
  },
};

const CATEGORY_AGRICOLA = {
  id: 'agricola-soft', domain: 'COMMODITIES',
  label: 'Agrícola & Soft', labelShort: 'Agrícola',
  procedure: {
    headline: 'Acceso a Operaciones Agrícolas y Soft Commodities',
    market_note: 'Contenido operativo en preparación.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA AGRÍCOLA]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 75, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos en agrícola y soft commodities.', cta: 'Puedes proponer una operación ad hoc.' },
    teasers: [], mandate_ids: [],
  },
  // [INV-AIMON-VOICE-01 · E6-T10 · 2026-06-02]
  aimon: {
    procedure:   'El mercado de commodities agrícolas físicos filtra por capacidad logística antes que por volumen declarado. El cuestionario en pantalla evalúa acceso a infraestructura portuaria, contratos de offtake verificados y financiación documentaria. Estamos saturados de mandatos sin capacidad de embarque real. Si puedes demostrar acceso a puerto y LC confirmada, el sistema te cualifica.',
    opportunity: 'Las posiciones en granos y soft commodities requieren contrato de offtake verificado y acceso a trade finance documentario. Buscamos contrapartes con infraestructura de embarque propia o LC confirmada en banco de primer nivel. El IntegrityScore refleja capacidad logística real. La soja no se estructura sin LC confirmada — tampoco el trigo ni el maíz.',
  },
};

const CATEGORY_VENTURES_EQUITY = {
  id: 'venture-equity', domain: 'VENTURES',
  label: 'Venture Equity', labelShort: 'Equity',
  procedure: {
    headline: 'Acceso a Operaciones de Venture Equity',
    market_note: 'Contenido operativo en preparación.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA VENTURES]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 75, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos de venture equity.', cta: 'Puedes proponer una operación ad hoc.' },
    teasers: [],
    mandate_ids: ['AIP-V-2026-001'],
  },
  // [INV-AIMON-VOICE-01 · E6-T10 · 2026-06-02]
  aimon: {
    procedure:   'El acceso a operaciones de venture en AIP exige perfil de inversor cualificado con ticket mínimo verificable y experiencia demostrable en rondas anteriores. El formulario en pantalla separa inversores con capacidad de despliegue de capital de consultores sin mandato de inversión. Si puedes documentar participación en rondas Serie A o superior, accedes al deal flow activo.',
    opportunity: 'Las posiciones en venture requieren inversor cualificado con ticket verificado y tolerancia a horizontes de 5-7 años. Buscamos contrapartes con experiencia en governance de portfolio y capacidad de follow-on documentada. El IntegrityScore refleja sofisticación de inversor — no volumen declarado. Sin track record verificable no hay acceso a deal flow.',
  },
};

// [INV-AIMON-VOICE-01 · E6-T10 · 2026-06-02] Stubs M&A y Soluciones Financieras con AIMON

const CATEGORY_MA = {
  id: 'compraventa-empresarial', domain: 'MA_REAL_ESTATE',
  label: 'Compraventa Empresarial', labelShort: 'M&A',
  procedure: {
    headline: 'Acceso a Operaciones de M&A',
    market_note: 'Contenido operativo en preparación. Director provee material según INV-PEDAGOGY-01.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer mandato', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA M&A]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 65, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos de M&A en mercado medio.', cta: 'Puedes proponer un mandato cualificado.' },
    teasers: [], mandate_ids: ['AIP-M-2026-001'],
  },
  aimon: {
    procedure:   'Las operaciones de M&A en mercado medio exigen documentación que soporte due diligence de Nivel 2 antes de cualquier introducción a contraparte. El formulario en pantalla filtra mandatos con prueba de fondos de consultas exploratorias sin respaldo. Estamos saturados de LOIs sin capacidad financiera demostrable. Si adjuntas Proof of Funds verificable, el sistema asigna analista.',
    opportunity: 'La activación de un mandato M&A requiere demostración de capacidad de cierre — no declaración de intención. Buscamos contrapartes con equity ticket verificado o línea de adquisición confirmada por banco de primer nivel. El IntegrityScore aquí refleja solvencia documental. Una LOI sin PoF no activa ningún proceso — tampoco un NDA sin mandato firmado.',
  },
};

const CATEGORY_SOLUCIONES_FINANCIERAS = {
  id: 'deuda-estructurados', domain: 'SOLUCIONES_FINANCIERAS',
  label: 'Deuda & Estructurados', labelShort: 'Soluciones',
  procedure: {
    headline: 'Acceso a Soluciones de Garantía e Instrumentos Financieros',
    market_note: 'Contenido operativo en preparación. Director provee material según INV-PEDAGOGY-01.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer estructuración', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA SOLUCIONES]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 70, kycTier: 2 },
    empty_state: { text: 'Evaluando estructuración de instrumentos de garantía.', cta: 'Puedes proponer una estructura.' },
    teasers: [], mandate_ids: [],
  },
  aimon: {
    procedure:   'La estructuración de instrumentos financieros exige verificación de línea de crédito activa antes de cualquier proceso. El formulario en pantalla separa entidades con capacidad real de emisión de solicitantes sin respaldo bancario. Estamos saturados de consultas sobre SBLC sin línea confirmada. Si puedes demostrar capacidad de emisión bajo formato ICC, accedes al estructurador.',
    opportunity: 'La activación de soluciones de garantía opera exclusivamente con contrapartes de grado inversor o respaldo bancario de primer nivel. Buscamos entidades que puedan emitir o recibir una SBLC MT760 o BG bajo normativa ICC-UCP600. El IntegrityScore refleja capacidad de emisión real — no intención. Sin línea de crédito activa, no hay estructura posible.',
  },
};

/**
 * Map de categorías L2 — keyed by id.
 * Acceso: mockState.categories['commodities-metales-mineria']
 */
// Keys = category IDs del DEFAULT_TAXONOMY en aip-orbit1-tree.js (SSoT del árbol)
// [CRM-RE-01 · 2026-06-05] Real Estate Comercial — procedimiento + oportunidades
const CATEGORY_RE_COMERCIAL = {
  id: 'real-estate-comercial', domain: 'MA_REAL_ESTATE',
  label: 'Real Estate Comercial', labelShort: 'RE Comercial',
  procedure: {
    headline: 'Acceso a Operaciones de Real Estate Comercial',
    market_note: 'AIP intermedia operaciones de activos comerciales (oficinas, logística, retail) bajo mandato fiduciario verificado. El proceso comienza con la acreditación de capacidad de adquisición y el perfil de mandato del inversor.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA RE COMERCIAL]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 60, kycTier: 1 },
    empty_state: { text: 'Mandatos de activos comerciales en revisión activa.', cta: 'Puedes proponer un activo para evaluación.' },
    teasers: [], mandate_ids: ['AIP-M-2026-002'],
  },
  aimon: {
    procedure:   'Las operaciones de real estate comercial en AIP requieren verificación de mandato de compra y capacidad de financiación documentada antes de cualquier proceso de introducción. El cuestionario en pantalla filtra compradores sin PoF verificable de consultas de alto volumen sin respaldo. Si tienes equity propio o línea de adquisición bancaria activa, el sistema asigna analista.',
    opportunity: 'La activación de mandatos de RE comercial requiere contraparte con equity ticket mínimo verificable y horizonte de inversión de 3-7 años. El IntegrityScore mínimo refleja solvencia documental y capacidad de cierre. Un activo comercial no se estructura sin trazabilidad del origen de fondos — tampoco sin due diligence de arrendatario.',
  },
};

// [CRM-RE-01 · 2026-06-05] Real Estate Premium / Residencial — procedimiento + oportunidades
const CATEGORY_RE_PREMIUM = {
  id: 'real-estate-premium', domain: 'MA_REAL_ESTATE',
  label: 'Real Estate Premium / Residencial', labelShort: 'RE Premium',
  procedure: {
    headline: 'Acceso a Operaciones de Real Estate Premium y Residencial',
    market_note: 'AIP gestiona mandatos de activos residenciales premium bajo protocolo fiduciario STAK. El proceso de cualificación verifica origen de fondos, perfil de inversor y alineamiento regulatorio antes de cualquier introducción a activo.',
    compliance_doc: null, steps: [],
    propose_cta: { label: 'Proponer activo', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA RE PREMIUM]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 65, kycTier: 1 },
    empty_state: { text: 'Pipeline de activos residenciales premium activo. Mandatos sujetos a NCNDA.', cta: 'Cualifícate para acceder al deal flow.' },
    teasers: [], mandate_ids: [],
  },
  aimon: {
    procedure:   'El acceso a activos residenciales premium en AIP opera bajo esclusa fiduciaria completa: verificación de identidad, beneficiario final y origen de fondos conforme a AML/KYC antes de cualquier revelación de activo. Estamos saturados de consultas sin capacidad de cierre documentada. Si puedes acreditar equity disponible y perfil de inversor cualificado, el sistema activa el proceso de matching.',
    opportunity: 'Los mandatos de RE premium requieren inversor cualificado con capacidad de cierre documentada y tolerancia a estructuras de confidencialidad total hasta matching mutuo. El IntegrityScore refleja trazabilidad del capital y alineamiento regulatorio. Un activo premium no se presenta sin NCNDA ejecutada — tampoco sin verificación de beneficiario final bajo FATF.',
  },
};

// [CRM-RE-01 · 2026-06-05] Stubs para categorías huérfanas del árbol (evitan abort silencioso)
const CATEGORY_EQUITY_CAPITAL = {
  id: 'equity-capital', domain: 'SOLUCIONES_FINANCIERAS',
  label: 'Equity & Capital', labelShort: 'Equity',
  procedure: { headline: 'Equity & Capital', market_note: 'Contenido en preparación.', compliance_doc: null, steps: [],
    propose_cta: { label: 'Consultar', description: '', contact: 'mailto:admin@breederhub.store?subject=[EQUITY CAPITAL]' } },
  opportunities: { unlock_threshold: { integrityScore: 65, kycTier: 2 }, empty_state: { text: 'En preparación.', cta: '' }, teasers: [], mandate_ids: [] },
  aimon: { procedure: 'Contenido en preparación.', opportunity: 'Contenido en preparación.' },
};
const CATEGORY_HIBRIDOS = {
  id: 'hibridos-alternativos', domain: 'SOLUCIONES_FINANCIERAS',
  label: 'Híbridos & Alternativos', labelShort: 'Híbridos',
  procedure: { headline: 'Híbridos & Alternativos', market_note: 'Contenido en preparación.', compliance_doc: null, steps: [],
    propose_cta: { label: 'Consultar', description: '', contact: 'mailto:admin@breederhub.store?subject=[HIBRIDOS]' } },
  opportunities: { unlock_threshold: { integrityScore: 65, kycTier: 2 }, empty_state: { text: 'En preparación.', cta: '' }, teasers: [], mandate_ids: [] },
  aimon: { procedure: 'Contenido en preparación.', opportunity: 'Contenido en preparación.' },
};
const CATEGORY_GROWTH_CAPITAL = {
  id: 'growth-capital', domain: 'AIP_VENTURES',
  label: 'Growth Capital', labelShort: 'Growth',
  procedure: { headline: 'Growth Capital', market_note: 'Contenido en preparación.', compliance_doc: null, steps: [],
    propose_cta: { label: 'Consultar', description: '', contact: 'mailto:admin@breederhub.store?subject=[GROWTH CAPITAL]' } },
  opportunities: { unlock_threshold: { integrityScore: 65, kycTier: 2 }, empty_state: { text: 'En preparación.', cta: '' }, teasers: [], mandate_ids: [] },
  aimon: { procedure: 'Contenido en preparación.', opportunity: 'Contenido en preparación.' },
};
const CATEGORY_ESTRUCTURADOS_VENTURE = {
  id: 'estructurados-venture', domain: 'AIP_VENTURES',
  label: 'Estructurados Venture', labelShort: 'Estructurados',
  procedure: { headline: 'Estructurados Venture', market_note: 'Contenido en preparación.', compliance_doc: null, steps: [],
    propose_cta: { label: 'Consultar', description: '', contact: 'mailto:admin@breederhub.store?subject=[ESTRUCTURADOS VENTURE]' } },
  opportunities: { unlock_threshold: { integrityScore: 65, kycTier: 2 }, empty_state: { text: 'En preparación.', cta: '' }, teasers: [], mandate_ids: [] },
  aimon: { procedure: 'Contenido en preparación.', opportunity: 'Contenido en preparación.' },
};

const CATEGORIES_DATA = {
  // Commodities
  'metales-mineria':         CATEGORY_METALES,
  'energia-derivados':       CATEGORY_ENERGIA,
  'agricola-soft':           CATEGORY_AGRICOLA,
  // M&A & Real Estate (E6-T10 · 2026-06-02 — stub con AIMON producción)
  'compraventa-empresarial': CATEGORY_MA,
  // [CRM-RE-01 · 2026-06-05] Inmobiliarias — procedimiento + oportunidades para demo VIP
  'real-estate-comercial':   CATEGORY_RE_COMERCIAL,
  'real-estate-premium':     CATEGORY_RE_PREMIUM,
  // Soluciones Financieras
  'deuda-estructurados':     CATEGORY_SOLUCIONES_FINANCIERAS,
  'equity-capital':          CATEGORY_EQUITY_CAPITAL,
  'hibridos-alternativos':   CATEGORY_HIBRIDOS,
  // AIP Ventures
  'venture-equity':          CATEGORY_VENTURES_EQUITY,
  'growth-capital':          CATEGORY_GROWTH_CAPITAL,
  'estructurados-venture':   CATEGORY_ESTRUCTURADOS_VENTURE,
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
