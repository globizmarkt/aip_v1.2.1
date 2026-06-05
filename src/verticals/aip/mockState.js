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

// [SEC-03-E] Mandate AIP-M-2026-005 — M&A Advisory (CUALIFICADO · KYC Tier 4)
// Adquisición 100% acciones — Energía Andina S.A.S. (Colombia)
// Fuente: D_mock_data_enriched.md (Qwen · despachos_04.1.1) — COG-222
// CRM-MA-01 — inauguración vertical M&A · 2026-06-05
const MANDATE_005 = {
  mandateId:      'AIP-M-2026-005',
  type:           'Advisory',
  locked:         false,

  parties: {
    originator:     'BreederHub Advisory SA',
    client:         'Fondo de Infraestructura Latam IV',
    counterparties: ['Energía Andina S.A.S. (Target)'],
  },

  asset: {
    class:          'M&A Advisory',
    spec:           'Adquisición 100% acciones — Infraestructura Energética Colombia',
    quantity:       '100% Equity',
    estimatedValue: 245_000_000,
    currency:       'USD',
    incoterm:       null,
    trialLot:       null,
  },

  financials: {
    enterpriseValue: 245_000_000,
    ebitdaLTM:       32_500_000,
    ebitdaMargin:    '13.3%',
    netDebt:         28_000_000,
  },

  compliance: {
    kycTier:         4,
    amlClear:        true,
    sanctionsCheck:  true,
    ncndaSigned:     true,
    sgsCertificate:  null,
    sblcProvider:    null,
    sblcAmount:      null,
  },

  timeline: {
    created:        '2026-04-10',
    targetClose:    '2026-11-30',
    lastActivity:   '2026-06-04',
    nextMilestone:  'Fase 2 Due Diligence & SPA Finalization',
  },

  fiduciaryState: FIDUCIARY_STATES.CUALIFICADO,

  documents: [
    'Teaser Confidencial',
    'CIM (Confidential Information Memorandum)',
    'NDA Bilateral Ejecutado',
    'LOI No Vinculante',
    'SPA Draft v2.1',
    'KYC Tier 4 Package',
    'AML/OFAC Screening Report',
    'UBO Declaration Certificate',
    'Due Diligence Report — Fase 1',
    'Due Diligence Report — Fase 2',
  ],

  complianceDocuments: [
    'compliance-kyc-l4',
  ],

  notes: [
    'EBITDA LTM validado por Big4. Margen estable en 13.3%.',
    'Deuda neta de $28M sujeta a refinanciación post-cierre.',
    'Proceso de DD Fase 2 en curso — enfoque en permisos ambientales y contratos de offtake.',
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
    market_note: 'AIP intermedia operaciones de M&A en mercado medio bajo mandato fiduciario verificado. Proceso sell-side institucionalizado con VDD ejecutada y clearance AML como gate previo a apertura de VDR.',
    compliance_doc: null,
    // [CRM-MA-01 · 2026-06-05] Pipeline M&A — Fuente: A_PIPELINE_steps_mockState.md (GEM · despachos_04.1.2)
    steps: [
      {
        order:       1,
        title:       'Engagement & Vendor Due Diligence',
        description: 'Firma de mandato, estrategia y VDD. Gate: Obligatorio carga de reportes VDD y modelo financiero saneado antes del go-to-market.',
        kycRequired: 3,
        documents:   [],
        sla:         '30-45 días',
      },
      {
        order:       2,
        title:       'NDA & CIM Distribution',
        description: 'Distribución de perfil ciego y Memorándum Confidencial (CIM) únicamente a contrapartes cualificadas bajo NDA bilateral ejecutado.',
        kycRequired: 3,
        documents:   [],
        sla:         '5-10 días',
      },
      {
        order:       3,
        title:       'Indicaciones de Interés (IOI / NBOs)',
        description: 'Evaluación de ofertas no vinculantes. Gate: Si el spread de IOI es anómalo, se activará revisión de inconsistencias en CIM y buyer targeting.',
        kycRequired: 4,
        documents:   [],
        sla:         '15-21 días',
      },
      {
        order:       4,
        title:       'Due Diligence del Comprador (VDR)',
        description: 'Apertura de data room virtual. Gate: Alerta de enfriamiento si Q&A presenta >20 open items y tiempo de respuesta promedio >72h.',
        kycRequired: 4,
        documents:   [],
        sla:         '30-60 días',
      },
      {
        order:       5,
        title:       'Binding Offers & Signing',
        description: 'Recepción de SPA markup y ofertas vinculantes. Gate: Bloqueo estricto si se solicita exclusividad sin tracker de Due Diligence evidenciable.',
        kycRequired: 4,
        documents:   [],
        sla:         '14-30 días',
      },
      {
        order:       6,
        title:       'Closing & Post-Closing',
        description: 'Cumplimiento de condiciones precedentes, filing regulatorio (antitrust), transferencia mecánica de fondos y cierre del escrow.',
        kycRequired: 4,
        documents:   [],
        sla:         '15-60 días',
      },
    ],
    propose_cta: { label: 'Proponer mandato', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA M&A]' },
  },
  // [CRM-MA-01 · 2026-06-05] Inauguración vertical M&A — MANDATE_005 conectado
  opportunities: {
    unlock_threshold: { integrityScore: 65, kycTier: 2 },
    empty_state: { text: 'Estamos evaluando mandatos de M&A en mercado medio.', cta: 'Puedes proponer un mandato cualificado.' },
    teasers: [
      {
        id:             'AIP-M-2026-005',
        category_label: 'M&A Advisory',
        value_range:    '$245M EV · EBITDA $32.5M',
        type:           'Advisory',
        status:         'Cualificado',
        dealType:       'Adquisición 100% acciones',
        locations:      'Colombia',
      },
    ],
    mandate_ids: ['AIP-M-2026-005'],
  },
  // [CRM-MA-01 · 2026-06-05] Aimon actualizado para reflejar MANDATE_005 activo — GEM despachos_04.1.2
  aimon: {
    procedure:   'Proceso sell-side institucionalizado. Gate estricto: VDD ejecutada y clearance AML previo a apertura de VDR. Monitoreo pasivo de tracción y Q&A.',
    opportunity: 'MANDATE_005 en curso: Adquisición 100% de Energía Andina S.A.S. (Colombia). Target de infraestructura crítica. Valoración $245M, EBITDA $32.5M.',
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
    compliance_doc: null,
    // [CRM-RE-01 · 2026-06-05] Pipeline RE Comercial — Fuente: A_PIPELINE_steps_mockState.md (GEM · despachos_04.1.2)
    steps: [
      {
        order:       1,
        title:       'Captación & Due Diligence Técnica',
        description: 'Firma del mandato de intermediación, verificación de cargas registrales, estado urbanístico y valoración independiente.',
        kycRequired: 2,
        documents:   [],
        sla:         '15-30 días',
      },
      {
        order:       2,
        title:       'Esclusa Fiduciaria: AML/KYC',
        description: 'Gate obligatorio: Verificación de beneficiario real y origen de fondos según Ley 10/2010. Bloqueo estricto de go-to-market sin UBO evidence.',
        kycRequired: 3,
        documents:   [],
        sla:         '5-10 días',
      },
      {
        order:       3,
        title:       'Comercialización & Ofertas',
        description: 'Distribución de Investment Memorandum a perfiles aprobados, gestión de visitas técnicas y recepción de IOIs formales.',
        kycRequired: 3,
        documents:   [],
        sla:         '30-90 días',
      },
      {
        order:       4,
        title:       'Negociación & Contrato de Arras',
        description: 'Negociación de precio, levantamiento de contingencias y firma de arras con depósito de señal (5-10%).',
        kycRequired: 3,
        documents:   [],
        sla:         '10-20 días',
      },
      {
        order:       5,
        title:       'Condiciones Precedentes & Cierre Notarial',
        description: 'Aprobación de financiación, firma en notaría, justificación de medios de pago, liquidación impositiva e inscripción registral.',
        kycRequired: 4,
        documents:   [],
        sla:         '30-45 días',
      },
    ],
    propose_cta: { label: 'Proponer operación', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA RE COMERCIAL]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 60, kycTier: 1 },
    empty_state: { text: 'Mandatos de activos comerciales en revisión activa.', cta: 'Puedes proponer un activo para evaluación.' },
    teasers: [], mandate_ids: ['AIP-M-2026-002'],
  },
  aimon: {
    procedure:   'La intermediación de activos comerciales opera exclusivamente bajo mandato fiduciario verificado y esclusa de cualificación previa. El sistema requiere acreditación de capacidad de cierre y origen de fondos antes de revelar cualquier dato estructural del activo. Las solicitudes sin Proof of Funds documentado o sin perfil MiFID II validado son descartadas automáticamente en esta fase.',
    opportunity: 'Los mandatos activos en este dominio exigen contrapartes con ticket de equity verificable y horizonte de inversión de 3 a 7 años. El IntegrityScore mínimo refleja solvencia documental y trazabilidad del capital, no volumen declarado. Un activo comercial no se estructura sin due diligence de arrendatario ni sin validación de la cadena de titularidad.',
  },
};

// [CRM-RE-01 · 2026-06-05] Real Estate Premium / Residencial — procedimiento + oportunidades
const CATEGORY_RE_PREMIUM = {
  id: 'real-estate-premium', domain: 'MA_REAL_ESTATE',
  label: 'Real Estate Premium / Residencial', labelShort: 'RE Premium',
  procedure: {
    headline: 'Acceso a Operaciones de Real Estate Premium y Residencial',
    market_note: 'AIP gestiona mandatos de activos residenciales premium bajo protocolo fiduciario STAK. El proceso de cualificación verifica origen de fondos, perfil de inversor y alineamiento regulatorio antes de cualquier introducción a activo.',
    compliance_doc: null,
    // [CRM-RE-01 · 2026-06-05] Pipeline RE Premium — Fuente: A_PIPELINE_steps_mockState.md (GEM · despachos_04.1.2)
    steps: [
      {
        order:       1,
        title:       'Onboarding & Estructura STAK',
        description: 'Recepción del mandato institucional y definición del fideicomiso. Implementación de segregación económica y blindaje de la titularidad legal.',
        kycRequired: 3,
        documents:   [],
        sla:         '5-10 días',
      },
      {
        order:       2,
        title:       'Esclusa Fiduciaria: FATF, UBO & NCNDA',
        description: 'Gate obligatorio: Screening estricto, verificación FATF y firma de NCNDA previo a revelación del activo. Enhanced Due Diligence ante pagadores opacos.',
        kycRequired: 4,
        documents:   [],
        sla:         '10-15 días',
      },
      {
        order:       3,
        title:       'Data Room Ciego & Due Diligence Asimétrica',
        description: 'Auditoría técnica premium y distribución controlada de información. Recepción de Binding Offers de inversores cualificados.',
        kycRequired: 4,
        documents:   [],
        sla:         '30-60 días',
      },
      {
        order:       4,
        title:       'Ejecución del Mandato STAK',
        description: 'Firma de arras o promesa de compraventa bajo mandato. Transferencia de fondos a cuentas escrow bajo supervisión y bloqueo.',
        kycRequired: 4,
        documents:   [],
        sla:         '10-20 días',
      },
      {
        order:       5,
        title:       'Transferencia Soberana & Cierre',
        description: 'Emisión de certificados depositarios o cierre notarial directo. Cambio de titularidad con trazabilidad inmutable y clearance regulatorio.',
        kycRequired: 4,
        documents:   [],
        sla:         '1-5 días',
      },
    ],
    propose_cta: { label: 'Proponer activo', description: '', contact: 'mailto:admin@breederhub.store?subject=[PROPUESTA RE PREMIUM]' },
  },
  opportunities: {
    unlock_threshold: { integrityScore: 65, kycTier: 1 },
    empty_state: { text: 'Pipeline de activos residenciales premium activo. Mandatos sujetos a NCNDA.', cta: 'Cualifícate para acceder al deal flow.' },
    teasers: [], mandate_ids: [],
  },
  aimon: {
    procedure:   'El acceso a activos residenciales premium, con foco en el cluster portugués de alta gama, opera bajo protocolo fiduciario STAK y esclusa de cumplimiento total. La verificación de identidad, beneficiario final y origen de fondos conforme a AML/KYC es condición ineludible antes de cualquier revelación de activo. Las consultas sin capacidad de cierre documentada o sin perfil MiFID II validado son filtradas automáticamente en esta fase.',
    opportunity: 'Los mandatos de real estate premium requieren inversor cualificado con tolerancia a estructuras de confidencialidad total hasta el matching mutuo. El IntegrityScore refleja trazabilidad del capital y alineamiento regulatorio, no meras declaraciones de interés. Un activo de esta clase no se presenta sin NCNDA ejecutada ni sin verificación de beneficiario final bajo estándares FATF.',
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

  // ── [SEC-07-MA] Documentos M&A — mandato AIP-M-2026-005 ──────────────
  // Fuente: D_mock_data_enriched.md (Qwen · despachos_04.1.1) — COG-222
  // CRM-MA-01 · 2026-06-05

  'ma-teaser-005': {
    id:          'ma-teaser-005',
    label:       'Teaser Confidencial — Energía Andina S.A.S.',
    type:        'teaser',
    category_id: 'compraventa-empresarial',
    kycRequired: 3,
    downloadUrl: null,
    description: 'Resumen ejecutivo anónimo de la oportunidad de adquisición 100% acciones. Infraestructura energética Colombia. EV indicativo $245M.',
    version:     'v1.0',
    lastUpdated: '2026-04-10',
  },

  'ma-cim-005': {
    id:          'ma-cim-005',
    label:       'CIM — Infraestructura Energética Colombia',
    type:        'cim',
    category_id: 'compraventa-empresarial',
    kycRequired: 4,
    downloadUrl: null,
    description: 'Confidential Information Memorandum. EV $245M · EBITDA LTM $32.5M (margen 13.3%) · Deuda neta $28M. Big4 auditado.',
    version:     'v1.0',
    lastUpdated: '2026-04-15',
  },

  // ── [SEC-07-COMPLIANCE] Paquetes KYC por nivel ───────────────────────
  // Fuente: D_mock_data_enriched.md (Qwen · despachos_04.1.1) — COG-224
  // CRM-MA-01 · 2026-06-05

  'compliance-kyc-l2': {
    id:          'compliance-kyc-l2',
    label:       'Paquete KYC Nivel 2',
    type:        'compliance',
    category_id: 'compliance-general',
    kycRequired: 2,
    downloadUrl: null,
    description: 'Formulario de identidad y screening de sanciones inicial.',
    version:     'v1.0',
    lastUpdated: '2026-06-05',
  },

  'compliance-kyc-l3': {
    id:          'compliance-kyc-l3',
    label:       'Paquete KYC Nivel 3',
    type:        'compliance',
    category_id: 'compliance-general',
    kycRequired: 3,
    downloadUrl: null,
    description: 'Pasaporte/DNI, selfie biométrica y prueba de domicilio.',
    version:     'v1.0',
    lastUpdated: '2026-06-05',
  },

  'compliance-kyc-l4': {
    id:          'compliance-kyc-l4',
    label:       'Paquete KYC Nivel 4',
    type:        'compliance',
    category_id: 'compliance-general',
    kycRequired: 4,
    downloadUrl: null,
    description: 'Declaración de patrimonio, Source of Funds (SoF) y test de suitability MiFID II.',
    version:     'v1.0',
    lastUpdated: '2026-06-05',
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
  mandates:   [MANDATE_001, MANDATE_002, MANDATE_003, MANDATE_004, MANDATE_005],
  ticker:     TICKER_DATA,
  categories: CATEGORIES_DATA,
  documents:  DOCUMENTS_REGISTRY,
});
