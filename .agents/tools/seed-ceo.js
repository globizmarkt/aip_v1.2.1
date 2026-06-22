#!/usr/bin/env node
// [Lead Architect AIP] / [Inyección Fiduciaria CEO Seed] / [API Modular v12+]

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const fs = require("fs");
const path = require("path");

// 1. Carga de credenciales físicas
const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ ERROR: No se encuentra el archivo serviceAccountKey.json en la raíz del proyecto.");
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

// Datos extraídos de la consola del Director
const TARGET_UID = "BWYZmDQ2w3gTjfmW3Ewqgo2sq413";
const TARGET_EMAIL = "admin@breederhub.store";

async function runSeed() {
    console.log(`[INIT] Comenzando inyección fiduciaria para: ${TARGET_EMAIL} (${TARGET_UID})`);

    try {
        // Fase A: Inyección de Custom Claims (Autorización)
        const claims = {
            role: 'superadmin',
            level: 3,
            kyc_verified: true,
            tenant_id: 'GLOBAL'
        };
        await auth.setCustomUserClaims(TARGET_UID, claims);
        console.log("✔ FASE A: Custom Claims inyectados en el token OAuth.");

        // Fase B: Creación del documento canónico (Interfaz de usuario)
        const userDoc = {
            uid: TARGET_UID,
            email: TARGET_EMAIL,
            kyc: 'verified',
            status: 'ACTIVE',
            role: 'superadmin',
            clearance_level: 3,
            tenant_id: 'GLOBAL',
            perfil: {
                nombre: "CEO Founder",
                email: TARGET_EMAIL,
                telefono: "+34000000000",
                referidoPor: "SYSTEM"
            },
            createdAt: new Date()
        };

        await db.collection('users').doc(TARGET_UID).set(userDoc, { merge: true });
        console.log("✔ FASE B: Documento Firestore creado en /users.");

        console.log("[SUCCESS] Operación de inyección finalizada con éxito.");
        process.exit(0);

    } catch (error) {
        console.error("❌ [FATAL ERROR] Fallo en la inyección:", error);
        process.exit(1);
    }
}

runSeed();