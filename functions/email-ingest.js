const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

// Inicialización segura del Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');
const Busboy = require('@fastify/busboy');

const db = getFirestore();
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIMETYPES = new Set([
    'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'
]);

const extractEmail = (fromField) => {
    const match = fromField.match(/<([^>]+)>/);
    return match ? match[1].toLowerCase() : fromField.trim().toLowerCase();
};

exports.emailWebhook = onRequest({ maxInstances: 5 }, async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // [SECURITY-01] Validación segura de clave compartida (anti-timing attacks)
    const providedKey = Buffer.from((req.headers['x-webhook-key'] || '').trim(), 'utf-8');
    const envKey = Buffer.from((process.env.SENDGRID_WEBHOOK_KEY || '').trim(), 'utf-8');

    if (providedKey.length === 0 || providedKey.length !== envKey.length || !crypto.timingSafeEqual(providedKey, envKey)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const busboy = new Busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE_BYTES } });
    const fields = {};
    const attachments = [];

    busboy.on('field', (fieldname, val) => { fields[fieldname] = val; });
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (!ALLOWED_MIMETYPES.has(mimetype)) { file.resume(); return; }
        const chunks = [];
        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
            const buffer = Buffer.concat(chunks);
            attachments.push({ filename, mimetype, buffer, size: buffer.length });
        });
    });

    busboy.on('finish', async () => {
        try {
            if (!fields.from) return res.status(400).send('Missing "from" field');
            if (attachments.length === 0) return res.status(200).send('No valid attachments');

            const senderEmail = extractEmail(fields.from);
            let clientId = null;
            let status = 'PENDIENTE_CLASIFICACION';
            const clientQuery = await db.collection('bhub_clients').where('email', '==', senderEmail).limit(1).get();
            
            if (!clientQuery.empty) { clientId = clientQuery.docs[0].id; }
            else {
                const newClientRef = db.collection('bhub_clients').doc();
                clientId = newClientRef.id;
                status = 'PENDIENTE_VERIFICACION';
                await newClientRef.set({ email: senderEmail, status: 'PENDING', created_at: FieldValue.serverTimestamp() });
            }

            const batch = db.batch();
            const docIds = [];
            
            for (const att of attachments) {
                const hash = crypto.createHash('sha256').update(att.buffer).digest('hex');
                const docRef = db.collection('bhub_inbox/' + clientId + '/documents').doc(hash);
                const storagePath = 'clients/' + clientId + '/inbox/' + hash + '_' + att.filename;

                batch.set(docRef, {
                    file_name: att.filename, file_size: att.size, mime_type: att.mimetype, hash: hash,
                    storage_path: storagePath, channel: 'email',
                    source_metadata: { email_from: senderEmail, subject: fields.subject || 'Sin Asunto' },
                    status: status, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
                    ingested_by: 'email_processor_v1'
                }, { merge: true });
                
                docIds.push(hash);
            }

            await batch.commit();
            res.status(200).json({ success: true, clientId, documentsReceived: docIds.length, message: 'Documents received' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    });

    busboy.end(req.rawBody);
});