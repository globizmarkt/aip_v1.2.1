// ============================================================
// ARCHIVO  : daily-digest.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-07-11
// PROPÓSITO: Digest diario 8:00 (AS-5, despacho .17 BHUB_DIGEST-01) — agrupa
//            documentos ingeridos en las últimas 24h por cliente y los
//            persiste en `bhub_digests` para consumo del CRM.
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Configuración (schedule, timezone)
// [SEC-03] Lógica de negocio (dailyDigest)
// [SEC-04] Exports

// [SEC-01] Importaciones y dependencias
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (!require('firebase-admin').apps.length) {
    initializeApp();
}
const db = getFirestore();

// [SEC-02] Configuración
const SCHEDULE_CRON = '0 8 * * *';
const SCHEDULE_TIMEZONE = 'Europe/Madrid';

// [SEC-03] Lógica de negocio (core)
// SUB-TICKET PENDIENTE (SI BLOQUEADO, despacho .17): canal de entrega de email no
// definido por el Director. El documento se guarda con status 'PENDING_DELIVERY' y
// delivery_channel 'UNDECIDED' — envío por email queda como sub-ticket futuro.
exports.dailyDigest = onSchedule(
    {
        schedule: SCHEDULE_CRON,
        timeZone: SCHEDULE_TIMEZONE,
        maxInstances: 1,
    },
    async (event) => {
        console.log('[DIGEST-01] Iniciando generación de digest diario...');

        const now = Date.now();
        const yesterday = new Date(now - 24 * 60 * 60 * 1000);

        try {
            const snapshot = await db.collectionGroup('documents')
                .where('created_at', '>=', yesterday)
                .get();

            if (snapshot.empty) {
                console.log('[DIGEST-01] No hay nuevos documentos en las últimas 24h.');
                return null;
            }

            const digestsByClient = {};

            snapshot.forEach((doc) => {
                const clientId = doc.ref.parent.parent.id;
                if (!digestsByClient[clientId]) {
                    digestsByClient[clientId] = [];
                }
                const data = doc.data();
                digestsByClient[clientId].push({
                    file_name: data.file_name,
                    mime_type: data.mime_type,
                    channel: data.channel,
                    status: data.status,
                });
            });

            const batch = db.batch();
            const today = new Date().toISOString().split('T')[0];

            for (const clientId in digestsByClient) {
                const docs = digestsByClient[clientId];
                const digestRef = db.collection('bhub_digests').doc();
                batch.set(digestRef, {
                    client_id: clientId,
                    date: today,
                    generated_at: FieldValue.serverTimestamp(),
                    total_documents: docs.length,
                    documents: docs,
                    status: 'PENDING_DELIVERY',
                    delivery_channel: 'UNDECIDED',
                });
            }

            await batch.commit();
            console.log(`[DIGEST-01] Digest generado para ${Object.keys(digestsByClient).length} clientes.`);
            return null;
        } catch (error) {
            console.error('[DIGEST-01] Error generando digest:', error);
            return null;
        }
    }
);

// [SEC-04] Exports
// exports.dailyDigest ya declarado arriba (patrón Cloud Functions v2)
