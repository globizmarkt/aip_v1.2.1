// ============================================================
// ARCHIVO  : MandateRepository.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-03
// PROPÓSITO: Capa de acceso reactiva (reader-only) para la colección
//            'mandates' en Firestore. Fallback automático a mockState
//            si la colección está vacía o hay error de red.
// TICKET   : E6-T03 — FIRESTORE MANDATES
// DOCTRINA : R5 (Zero-Leak) — sin config Firebase aquí
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] Constantes
// [SEC-03] subscribeToMandates(onUpdate, onError) → unsub function
// [SEC-04] getMandatesOnce() → Promise<array>
// [SEC-05] Exports

// [SEC-01] Importaciones
import { getFirestore, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';

// [SEC-02] Constantes
const COLLECTION_NAME = 'mandates';

// [SEC-03] subscribeToMandates(onUpdate, onError) → unsub function
/**
 * Suscripción reactiva a la colección `mandates`.
 * Llama onUpdate(array) en cada cambio. Llama onError(err) en fallo.
 * El consumidor decide si usar fallback (mockState) cuando array.length === 0.
 * @returns {Function} unsub — llamar en disconnectedCallback para limpiar
 */
const subscribeToMandates = (onUpdate, onError) => {
    try {
        const db = getFirestore(getApp());
        const mandatesRef = collection(db, COLLECTION_NAME);

        const unsubscribe = onSnapshot(
            mandatesRef,
            (snapshot) => {
                const mandatesArray = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                if (onUpdate) onUpdate(mandatesArray);
            },
            (error) => {
                console.error('[MandateRepository] Firestore error:', error.code);
                if (onError) onError(error);
            }
        );

        return unsubscribe;
    } catch (err) {
        console.error('[MandateRepository] Init error:', err);
        if (onError) onError(err);
        return () => {}; // noop — evita crash en disconnectedCallback
    }
};

// [SEC-04] getMandatesOnce() → Promise<array>
/**
 * Lectura única (no reactiva). Para casos donde no se necesita
 * actualización en tiempo real (admin panels, exports, etc.)
 * @returns {Promise<Array>}
 */
const getMandatesOnce = async () => {
    const db = getFirestore(getApp());
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
    }));
};

// [SEC-05] Exports
export { subscribeToMandates, getMandatesOnce };
