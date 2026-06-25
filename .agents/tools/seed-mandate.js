#!/usr/bin/env node
// [Lead Architect AIP] / [Re-seed Canónico Mandato Piloto]
// Schema completo para UI fiduciaria + campos requeridos por aip-orbit1-tree.js
// Ejecutar: node .agents/tools/seed-mandate.js
// NOTA: usa .set() con merge:false → sobrescribe el doc ligero anterior

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const fs   = require('fs');

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERROR: No se encuentra serviceAccountKey.json en', serviceAccountPath);
    process.exit(1);
}

initializeApp({ credential: cert(require(serviceAccountPath)) });
const db = getFirestore();

async function runSeed() {
    console.log('[INIT] Re-seed canónico MND-2026-06-24-0001...');
    try {
        const mandateId = 'MND-2026-06-24-0001';

        // Campos requeridos por aip-orbit1-tree.js para renderizado
        // categoryId: 'metales-mineria' → domain 'commodities-trade'
        // status:     'ACTIVE' (mapeado desde fiduciaryState:'Qualified')
        // score:      0 (se actualizará cuando Director asigne integrityScoreAtCreation)
        // label:      texto visible en el árbol
        const mandateData = {
            mandateId,
            // ── Campos de árbol (requeridos por aip-orbit1-tree.js) ──────────────
            categoryId:  'metales-mineria',
            status:      'ACTIVE',
            score:       0,
            label:       'Gold Bullion SCO · 15,000 MT · XAU/USD',
            // ── Schema canónico fiduciario ────────────────────────────────────────
            createdAt:   Timestamp.fromDate(new Date('2026-01-06T00:00:00Z')),
            updatedAt:   FieldValue.serverTimestamp(),
            version:     1,
            type:        'Asset',
            purpose:     'Intermediation of Gold Bullion SCO sale mandate · 15,000 MT · Bank to Bank / Ledger to Ledger · Price 12/9 below LBMA spot.',
            asset: {
                class:          'Metals',
                description:    'Gold Bullion Non-GLD · purity ≥ 99.95% (999.5/1000) · internationally recognized hallmark · bars 1 KG / 12.5 KG · certified non-criminal origin · age < 5 years',
                currency:       'USD',
                estimatedValue: 1394326000000,
            },
            asset_quantity:  15000,
            asset_unit:      'tonnes',
            ticker_label:    'XAU/USD',
            fiduciaryState:  'Qualified',
            locked:          false,
            originatorId:    'AIP_COMMODITIES_DESK',
            counterparties:  ['Institutional seller — identity under NDA (CH/UK/AE/HK)'],
            compliance: {
                kycStatus:               'tier2_active',
                amlStatus:               'pending',
                integrityScoreAtCreation: null,
            },
            dealType:       'Bank to Bank · Ledger to Ledger · FOB',
            locations:      ['London', 'Zurich', 'Dubai', 'Hong Kong'],
            priceStructure: '12/9 below LBMA spot',
            priceReference: {
                lbmaSpotAtSCO: 3285,
                buyerPrice:    2891,
                priceDate:     '2026-01-06',
            },
            documents:  [],
            legacyId:   'AIP-M-2026-004',
            ownerId:    'AIP_COMMODITIES_DESK',
            // [SEED-RULE-01] members[] — UID del Director para acceso en Firestore Rules
            members:    ['BWYZmDQ2w3gTjfmW3Ewqgo2sq413'],
        };

        // merge: false → sobrescribe completamente el doc ligero
        await db.collection('mandates').doc(mandateId).set(mandateData, { merge: false });
        console.log('✔ Mandato canónico inyectado en Firestore producción.');
        console.log('{ "ok": true, "id": "' + mandateId + '", "estimatedValue": 1394326000000 }');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en re-seed:', error);
        process.exit(1);
    }
}

runSeed();
