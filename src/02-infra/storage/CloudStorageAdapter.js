// ============================================================
// ARCHIVO  : CloudStorageAdapter.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-06
// PROPÓSITO: Wrapper Firebase Cloud Storage — upload/download/delete de documentos de mandatos
// TICKET   : E6-DOC-01
// DOCTRINA : R5 (Zero-Leak) — config Firebase solo en FirebaseConnector.js
// ============================================================
// %[CARRIL-AIP-INFRA] - [Fase REBORN-04]

// ÍNDICE
// [SEC-01] Imports
// [SEC-02] Estado interno + utilidades privadas
// [SEC-03] _sanitizeFilename(name) → string
// [SEC-04] _buildPath(mandateId, filename) → string
// [SEC-05] _buildMetadata(meta) → object
// [SEC-06] CloudStorageAdapter.init(basePath)
// [SEC-07] CloudStorageAdapter.uploadDocument(file, mandateId, metadata) → Promise
// [SEC-08] CloudStorageAdapter.downloadDocument(storagePath) → Promise<string>
// [SEC-09] CloudStorageAdapter.deleteDocument(storagePath) → Promise<boolean>
// [SEC-10] CloudStorageAdapter.getUploadProgress(uploadTask, callbacks)
// [SEC-11] CloudStorageAdapter.lastUploadTask getter
// [SEC-12] Exports

// [SEC-01] Imports
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getApp } from 'firebase/app';

// [SEC-02] Estado interno
let _basePath = 'mandates';
let _lastUploadTask = null;

// [SEC-03] _sanitizeFilename — elimina caracteres no seguros para paths de Storage
function _sanitizeFilename(name) {
    if (!name || typeof name !== 'string') return 'unnamed';
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// [SEC-04] _buildPath — construye path canónico: {basePath}/{mandateId}/documents/{ts}_{filename}
function _buildPath(mandateId, filename) {
    return `${_basePath}/${mandateId}/documents/${Date.now()}_${_sanitizeFilename(filename)}`;
}

// [SEC-05] _buildMetadata — construye customMetadata plano (Firebase Storage solo admite strings)
function _buildMetadata(meta) {
    const out = {};
    if (meta.uploadedBy)   out.uploadedBy   = String(meta.uploadedBy);
    if (meta.documentType) out.documentType = String(meta.documentType);
    if (meta.description)  out.description  = String(meta.description);
    out.uploadedAt = new Date().toISOString();
    return out;
}

// [SEC-06] Adaptador principal
export const CloudStorageAdapter = {

    /**
     * Inicializa el prefijo raíz de Storage. Opcional — default 'mandates'.
     * @param {string} basePath
     */
    init(basePath = 'mandates') {
        if (basePath && typeof basePath === 'string') {
            _basePath = basePath.replace(/^\/|\/$/g, '');
        }
        console.log(`[CloudStorageAdapter] Inicializado. basePath: "${_basePath}"`);
    },

    // [SEC-07] uploadDocument
    /**
     * Sube un File a Cloud Storage bajo el path canónico del mandato.
     * @param {File}   file
     * @param {string} mandateId
     * @param {Object} [metadata] — { uploadedBy, documentType, description }
     * @returns {Promise<{ url, storagePath, size, contentType }>}
     */
    async uploadDocument(file, mandateId, metadata = {}) {
        if (!file || !(file instanceof File)) {
            throw new Error('[CloudStorageAdapter] uploadDocument: se requiere un objeto File válido.');
        }
        if (!mandateId || typeof mandateId !== 'string') {
            throw new Error('[CloudStorageAdapter] uploadDocument: mandateId es obligatorio.');
        }

        const storage     = getStorage(getApp());
        const storagePath = _buildPath(mandateId, file.name);

        console.log(`[CloudStorageAdapter] Upload iniciado: ${storagePath} (${(file.size / 1024).toFixed(1)} KB)`);

        const storageRef  = ref(storage, storagePath);
        const uploadTask  = uploadBytesResumable(storageRef, file, {
            customMetadata: _buildMetadata(metadata),
        });

        _lastUploadTask = uploadTask;

        try {
            await uploadTask;
            const url = await getDownloadURL(storageRef);
            console.log(`[CloudStorageAdapter] Upload completado: ${storagePath}`);
            return Object.freeze({ url, storagePath, size: file.size, contentType: file.type || 'application/octet-stream' });
        } catch (err) {
            console.error(`[CloudStorageAdapter] Upload fallido: ${storagePath}`, err);
            throw err;
        }
    },

    // [SEC-08] downloadDocument
    /**
     * Obtiene URL de descarga temporal a partir de un storagePath guardado en Firestore.
     * @param {string} storagePath
     * @returns {Promise<string>}
     */
    async downloadDocument(storagePath) {
        if (!storagePath) throw new Error('[CloudStorageAdapter] downloadDocument: storagePath es obligatorio.');
        const storage = getStorage(getApp());
        console.log(`[CloudStorageAdapter] Solicitando download URL: ${storagePath}`);
        try {
            return await getDownloadURL(ref(storage, storagePath));
        } catch (err) {
            console.error(`[CloudStorageAdapter] Error obteniendo download URL: ${storagePath}`, err);
            throw err;
        }
    },

    // [SEC-09] deleteDocument
    /**
     * Elimina un archivo de Cloud Storage. Patrón no-throw — retorna false en error.
     * @param {string} storagePath
     * @returns {Promise<boolean>}
     */
    async deleteDocument(storagePath) {
        if (!storagePath) {
            console.error('[CloudStorageAdapter] deleteDocument: storagePath es obligatorio.');
            return false;
        }
        const storage = getStorage(getApp());
        console.log(`[CloudStorageAdapter] Eliminando: ${storagePath}`);
        try {
            await deleteObject(ref(storage, storagePath));
            console.log(`[CloudStorageAdapter] Eliminado: ${storagePath}`);
            return true;
        } catch (err) {
            console.error(`[CloudStorageAdapter] Error eliminando: ${storagePath}`, err);
            return false;
        }
    },

    // [SEC-10] getUploadProgress
    /**
     * Suscribe callbacks de progreso a un uploadTask.
     * NOTA: si usas await uploadDocument(), onComplete y la Promise se disparan juntos.
     * Usar getUploadProgress OR await — no ambos sobre el mismo uploadTask.
     * @param {UploadTask}  [uploadTask] — si se omite, usa lastUploadTask
     * @param {Object}      callbacks — { onProgress(pct), onComplete(result), onError(err) }
     */
    getUploadProgress(uploadTask, callbacks = {}) {
        const task = uploadTask || _lastUploadTask;
        if (!task) {
            console.warn('[CloudStorageAdapter] getUploadProgress: ningún uploadTask disponible.');
            return;
        }
        const { onProgress, onComplete, onError } = callbacks;
        task.on(
            'state_changed',
            (snapshot) => {
                if (typeof onProgress === 'function') {
                    onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 10000) / 100);
                }
            },
            (error) => {
                console.error('[CloudStorageAdapter] Upload error:', error.code || error.message);
                if (typeof onError === 'function') onError(error);
            },
            async () => {
                if (typeof onComplete !== 'function') return;
                try {
                    const r = task.snapshot.ref;
                    onComplete(Object.freeze({
                        url:         await getDownloadURL(r),
                        storagePath: r.fullPath,
                        size:        task.snapshot.metadata.size,
                        contentType: task.snapshot.metadata.contentType || 'application/octet-stream',
                    }));
                } catch (err) {
                    console.error('[CloudStorageAdapter] Error en onComplete:', err);
                    if (typeof onError === 'function') onError(err);
                }
            }
        );
        console.log('[CloudStorageAdapter] Progreso suscrito a uploadTask.');
    },

    // [SEC-11] lastUploadTask getter
    get lastUploadTask() {
        return _lastUploadTask;
    },
};

// [SEC-12] Exports
export default CloudStorageAdapter;
