// ============================================================
// ARCHIVO  : seed-mandate-pilot.js
// VERSIÓN  : 1.0.2
// FECHA    : 2026-06-24
// PROPÓSITO: Seed script — inserta MND-2026-06-24-0001 (Gold Bullion SCO)
//            en Firestore via REST API con credenciales del firebase CLI.
//            Correr desde: C:\BreederHub\01_PRODUCTION\AIP_v1.2.1\functions\
//            Comando:      node seed-mandate-pilot.js
//            Pre:          firebase login activo (token en configstore)
//            Trazabilidad: INV-FORJA9-01 · DOMAIN_BLUEPRINT [SEC-05]
// ============================================================

// ÍNDICE
// [SEC-01] Imports y credenciales
// [SEC-02] Documento mandato piloto (Gold Bullion SCO)
// [SEC-03] Serializador Firestore REST
// [SEC-04] Ejecución del seed

// ─────────────────────────────────────────────────────────────
// [SEC-01] Imports y credenciales
// ─────────────────────────────────────────────────────────────

const https   = require('https');
const os      = require('os');
const path    = require('path');
const fs      = require('fs');

const PROJECT_ID  = 'aip-v1-3f57c';
const MANDATE_ID  = 'MND-2026-06-24-0001';
const FS_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Lee el access_token del configstore del firebase CLI
function getFirebaseToken() {
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) throw new Error('firebase-tools.json not found. Run: firebase login');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const token = config?.tokens?.access_token;
  if (!token) throw new Error('No access_token in firebase-tools.json. Run: firebase login');
  return token;
}

// ─────────────────────────────────────────────────────────────
// [SEC-02] Documento mandato piloto — Gold Bullion SCO
//
// Schema:   DOMAIN_BLUEPRINT_SYNTHESIS.md [SEC-05] (English — R-CROSS-01)
// Fuente:   mockState.js MANDATE_004 + SCO PDF 2026-01-06
// Precio:   15,000 MT × 32,150.7 oz/MT × $2,891/oz (12/9 below LBMA $3,285/oz)
//           = $1,394,326,000,000 USD (hardcoded reference — date 2026-01-06)
// Estado:   'Qualified' → visible para IS ≥ 75 / KYC Tier 2
// ─────────────────────────────────────────────────────────────

const mandatePilot = {
  mandateId:      MANDATE_ID,
  createdAt:      '2026-01-06T00:00:00Z',
  updatedAt:      '2026-06-24T00:00:00Z',
  version:        1,
  type:           'Asset',
  purpose:        'Intermediation of Gold Bullion SCO sale mandate · 15,000 MT · Bank to Bank / Ledger to Ledger · Price 12/9 below LBMA spot.',

  // asset (nested object)
  asset_class:          'Metals',
  asset_description:    'Gold Bullion Non-GLD · purity ≥ 99.95% (999.5/1000) · internationally recognized hallmark · bars 1 KG / 12.5 KG · certified non-criminal origin · age < 5 years',
  asset_currency:       'USD',
  asset_estimatedValue: 1394326000000,  // $1.394T USD — 15,000 MT at $2,891/oz

  // supplement: Metals
  asset_quantity: 15000,
  asset_unit:     'tonnes',
  ticker_label:   'XAU/USD',

  // supplement: deal
  fiduciaryState: 'Qualified',
  locked:         false,
  originatorId:   'AIP_COMMODITIES_DESK',
  dealType:       'Bank to Bank · Ledger to Ledger · FOB',
  priceStructure: '12/9 below LBMA spot',
  priceRef_lbmaSpotAtSCO: 3285,
  priceRef_buyerPrice:    2891,
  priceRef_date:          '2026-01-06',
  purityMin:              '99.95%',

  // supplement: compliance
  compliance_kycStatus:               'tier2_active',
  compliance_amlStatus:               'pending',
  compliance_integrityScoreAtCreation: null,

  // counterparties serialized as string (REST API flattened)
  counterparties_0: 'Institutional seller — identity under NDA (CH/UK/AE/HK)',

  // bridge to mockState while CRM electrification pending
  legacyId: 'AIP-M-2026-004',
};

// ─────────────────────────────────────────────────────────────
// [SEC-03] Serializador Firestore REST
// Convierte JS primitivos al formato Value de Firestore REST API
// ─────────────────────────────────────────────────────────────

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean')  return { booleanValue: val };
  if (typeof val === 'number')   return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string')   return { stringValue: val };
  if (Array.isArray(val))        return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return { fields };
}

// ─────────────────────────────────────────────────────────────
// [SEC-04] Ejecución del seed
// ─────────────────────────────────────────────────────────────

function request(method, urlPath, token, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(FS_BASE_URL + urlPath);
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function seed() {
  const token = getFirebaseToken();

  // Check if document already exists
  const check = await request('GET', `/mandates/${MANDATE_ID}`, token);
  if (check.status === 200) {
    console.log(`[SKIP] Mandate ${MANDATE_ID} already exists in Firestore.`);
    process.exit(0);
  }

  // Create document
  const docBody = toFirestoreDoc(mandatePilot);
  // Use PATCH with documentId to set specific document ID
  const res = await request('PATCH', `/mandates/${MANDATE_ID}`, token, docBody);

  if (res.status === 200 || res.status === 201) {
    console.log(`\n[OK] Mandate ${MANDATE_ID} inserted into mandates/${MANDATE_ID}`);
    console.log(`     type: ${mandatePilot.type}  ·  fiduciaryState: ${mandatePilot.fiduciaryState}`);
    console.log(`     asset: ${mandatePilot.asset_class}  ·  ${mandatePilot.asset_quantity} ${mandatePilot.asset_unit}`);
    console.log(`     estimatedValue: $${(mandatePilot.asset_estimatedValue / 1e9).toFixed(1)}B USD`);
    console.log('\n  NEXT → SYS-ADMIN-IS-01: set integrityScoreAtCreation via admin panel.\n');
  } else {
    console.error(`[ERROR] status ${res.status}: ${res.body}`);
    process.exit(1);
  }
}

seed().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
