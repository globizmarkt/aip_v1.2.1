const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

const db = getFirestore();
const META_VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
const META_ACCESS_TOKEN = process.env.META_WHATSAPP_ACCESS_TOKEN;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_MIMETYPES = new Set([
    'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'
]);

const normalizePhone = (phone) => phone.replace(/[\s\-\+\(\)]/g, '');

const downloadMediaFromMeta = async (mediaId) => {
    const urlRes = await fetch('https://graph.facebook.com/v21.0/' + mediaId + '?access_token=' + META_ACCESS_TOKEN);
    const urlData = await urlRes.json();
    if (!urlRes.ok || !urlData.url) throw new Error('Failed to get Meta CDN URL');
    const fileRes = await fetch(urlData.url);
    if (!fileRes.ok) throw new Error('Failed to download media');
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    return { buffer, mimeType: fileRes.headers.get('content-type') || 'application/octet-stream', size: buffer.length };
};

exports.whatsappWebhook = onRequest({ maxInstances: 5 }, async (req, res) => {
    if (req.method === 'GET') {
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === META_VERIFY_TOKEN) {
            return res.status(200).send(req.query['hub.challenge']);
        }
        return res.status(403).send('Forbidden');
    }
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    res.status(200).send('OK');
    
    try {
        const value = req.body?.entry?.[0]?.changes?.[0]?.value;
        if (value?.messages) {
            for (const message of value.messages) {
                if (message.type !== 'document' && message.type !== 'image') continue;
                const mediaObj = message.type === 'document' ? message.document : message.image;
                if (!mediaObj || !mediaObj.id) continue;
                const phone = normalizePhone(message.from);
                let clientId = null;
                let status = 'PENDIENTE_CLASIFICACION';
                const clientQuery = await db.collection('bhub_clients').where('phone', '==', phone).limit(1).get();
                if (!clientQuery.empty) { clientId = clientQuery.docs[0].id; }
                else {
                    const newClientRef = db.collection('bhub_clients').doc();
                    clientId = newClientRef.id;
                    status = 'PENDIENTE_VERIFICACION';
                    await newClientRef.set({ phone, status: 'PENDING', created_at: FieldValue.serverTimestamp() });
                }
                if (!ALLOWED_MIMETYPES.has(mediaObj.mime_type) || mediaObj.file_size > MAX_FILE_SIZE_BYTES) continue;
                const mediaData = await downloadMediaFromMeta(mediaObj.id);
                const hash = crypto.createHash('sha256').update(mediaData.buffer).digest('hex');
                const filename = mediaObj.filename || 'media_' + mediaObj.id + '.bin';
                const docRef = db.collection('bhub_inbox/' + clientId + '/documents').doc(hash);
                await docRef.set({
                    file_name: filename, file_size: mediaData.size, mime_type: mediaData.mimeType, hash: hash,
                    storage_path: 'clients/' + clientId + '/inbox/' + hash + '_' + filename, channel: 'whatsapp',
                    source_metadata: { from_phone: phone, from_name: message?.contact?.name || null, whatsapp_msg_id: message.id },
                    status: status, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
                    ingested_by: 'whatsapp_processor_v1'
                }, { merge: true });
            }
        }
    } catch (error) { console.error(error); }
});