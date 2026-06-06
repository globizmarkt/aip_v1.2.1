// ============================================================
// ARCHIVO  : DocumentRepository.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-06
// PROPÓSITO: Capa de acceso Firestore para documentos asociados a mandatos
// TICKET   : E6-DOC-01
// DOCTRINA : R5 (Zero-Leak) — config Firebase solo en FirebaseConnector.js
// ============================================================
// %[CARRIL-AIP-INFRA] - [Fase REBORN-04]

// ÍNDICE
// [SEC-01] Imports
// [SEC-02] Decisión arquitectónica
// [SEC-03] subscribeToDocuments(mandateId, onUpdate, onError) → unsub function
// [SEC-04] addDocument(mandateId, documentData) → Promise<id>
// [SEC-05] removeDocument(mandateId, documentId) → Promise<boolean>
// [SEC-06] getDocumentsOnce(mandateId) → Promise<Array>
// [SEC-07] Exports

// [SEC-01] Imports
import {
    getFirestore,
    collection,
    onSnapshot,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';

// [SEC-02] Decisión arquitectónica
// DECISIÓN: Los documentos se implementan como Subcolección física:
//   mandates/{mandateId}/documents
// JUSTIFICACIÓN:
//   - Evita saturar el límite de 1 MB del documento Firestore padre
//   - Permite control de acceso granular mediante Security Rules
//   - Optimiza red: no descarga metadata de adjuntos al leer el mandato padre
//   - Facilita paginación y consultas independientes por mandato
// COMPLEMENTARIO: CloudStorageAdapter gestiona el binario (Cloud Storage).
//   DocumentRepository gestiona solo los metadatos (Firestore).

// [SEC-03] subscribeToDocuments
/**
 * Escucha reactiva en tiempo real para los documentos vinculados a un mandato.
 * @param {string}   mandateId - ID canónico del mandato padre.
 * @param {Function} onUpdate  - Callback ejecutado con el array de documentos actualizado.
 * @param {Function} onError   - Callback para control de excepciones de Firestore.
 * @returns {Function} Función de desuscripción (unsubscribe).
 */
const subscribeToDocuments = (mandateId, onUpdate, onError) => {
    try {
        const db = getFirestore(getApp());
        const documentsRef = collection(db, 'mandates', mandateId, 'documents');

        const unsubscribe = onSnapshot(
            documentsRef,
            (snapshot) => {
                const documentsArray = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                if (typeof onUpdate === 'function') onUpdate(documentsArray);
            },
            (error) => {
                console.error('[DocumentRepository] Firestore real-time error:', error.code);
                if (typeof onError === 'function') onError(error);
            }
        );

        return unsubscribe;
    } catch (err) {
        console.error('[DocumentRepository] Subscription lifecycle error:', err);
        if (typeof onError === 'function') onError(err);
        return () => {};
    }
};

// [SEC-04] addDocument
/**
 * Inserta un nuevo registro de documento dentro de la subcolección del mandato.
 * El ID del documento lo genera automáticamente Firestore (inmutable).
 * @param {string} mandateId    - ID del mandato padre.
 * @param {Object} documentData - Datos del documento conformes al esquema de la vertical.
 * @returns {Promise<string>} ID generado por Firestore.
 */
const addDocument = async (mandateId, documentData) => {
    try {
        const db = getFirestore(getApp());
        const documentsRef = collection(db, 'mandates', mandateId, 'documents');

        const docRef = await addDoc(documentsRef, {
            mandateId,
            ...documentData,
        });

        return docRef.id;
    } catch (err) {
        console.error('[DocumentRepository] Failed to add document structure:', err);
        throw err;
    }
};

// [SEC-05] removeDocument
/**
 * Elimina el registro de metadatos del documento en Firestore.
 * NOTA: la purga del binario en Cloud Storage queda delegada a CloudStorageAdapter.deleteDocument().
 * @param {string} mandateId   - ID del mandato padre.
 * @param {string} documentId  - ID del documento a eliminar.
 * @returns {Promise<boolean>} true si éxito, lanza en caso de error.
 */
const removeDocument = async (mandateId, documentId) => {
    try {
        const db = getFirestore(getApp());
        const docRef = doc(db, 'mandates', mandateId, 'documents', documentId);

        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error('[DocumentRepository] Failed to remove document reference:', err);
        throw err;
    }
};

// [SEC-06] getDocumentsOnce
/**
 * Lectura transaccional única de los documentos de un mandato.
 * Orientado a procesos batch, exportaciones de auditoría o paneles estáticos.
 * @param {string} mandateId - ID del mandato padre.
 * @returns {Promise<Array>} Array con los documentos recuperados.
 */
const getDocumentsOnce = async (mandateId) => {
    try {
        const db = getFirestore(getApp());
        const documentsRef = collection(db, 'mandates', mandateId, 'documents');
        const snapshot = await getDocs(documentsRef);

        return snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
        }));
    } catch (err) {
        console.error('[DocumentRepository] Single-read fetching failed:', err);
        throw err;
    }
};

// [SEC-07] Exports
export { subscribeToDocuments, addDocument, removeDocument, getDocumentsOnce };
