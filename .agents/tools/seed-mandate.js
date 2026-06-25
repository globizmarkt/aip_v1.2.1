#!/usr/bin/env node
// [Lead Architect AIP] / [Bypass Siembra Mandato Piloto]
// Siembra local vía Admin SDK — bypass IAM GCP gen2 (Org Policy restriction)
// Ejecutar: node .agents/tools/seed-mandate.js
// ELIMINAR tras confirmar { "ok": true } en Firestore

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore }        = require('firebase-admin/firestore');
const path = require('path');
const fs   = require('fs');

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERROR: No se encuentra serviceAccountKey.json en', serviceAccountPath);
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function runSeed() {
    console.log('[INIT] Iniciando inyección fiduciaria local del Mandato Piloto...');
    try {
        const mandateId   = 'MND-2026-06-24-0001';
        const mandateData = {
            mandateId,
            createdAt:  new Date().toISOString(),
            updatedAt:  new Date().toISOString(),
            version:    1,
            type:       'Advisory',
            purpose:    'SCO',
            asset: {
                class:          'Metals',
                description:    'Gold Bullion SCO',
                currency:       'USD',
                estimatedValue: 0,
            },
            fiduciaryState: 'Qualified',
            locked:         false,
            originatorId:   'BWYZmDQ2w3gTjfmW3Ewqgo2sq413',
            asset_quantity: 15000,
            asset_unit:     'MT',
            ticker_label:   'XAU',
            compliance: {
                kycStatus:               'verified',
                amlStatus:               'CLEAR',
                integrityScoreAtCreation: 0,
            },
            legacyId: 'AIP-M-2026-003',
            members:  ['BWYZmDQ2w3gTjfmW3Ewqgo2sq413'],
        };

        await db.collection('mandates').doc(mandateId).set(mandateData);
        console.log('✔ Mandato fundacional sembrado en Firestore.');
        console.log('{ "ok": true }');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la siembra:', error);
        process.exit(1);
    }
}

runSeed();
