// ============================================================
// ARCHIVO  : FirebaseConnector.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-03
// PROPÓSITO: Inicialización Firebase AIP + exportación de servicios (Auth, Firestore, Storage)
// PROYECTO : aip-v1-3f57c
// DOCTRINA : R5 (Zero-Leak) — config sólo en este archivo, no duplicar en otros módulos
// ============================================================

// ÍNDICE
// [SEC-01] Config + Inicialización Firebase
// [SEC-02] Exportaciones de servicios (Auth, Firestore, Storage)
// [SEC-03] FirebaseConnector legacy — checkFuelPressure + sendTelegramAlert

// [SEC-01] Config + Inicialización Firebase
// NOTA: En producción esta config debe consumirse desde variables de entorno o
//       un secreto seguro. Para la fase de desarrollo (Fase 05 AIP Lights On)
//       se inyecta directamente conforme al Despacho Lead Architect 2026-06-03.
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
    apiKey:            'AIzaSyDaalpRf-oDrGyTu3AoDFwjE3ejkShAw6o',
    authDomain:        'aip-v1-3f57c.firebaseapp.com',
    projectId:         'aip-v1-3f57c',
    storageBucket:     'aip-v1-3f57c.firebasestorage.app',
    messagingSenderId: '171234470705',
    appId:             '1:171234470705:web:479edce949970bc6e85e10',
    measurementId:     'G-7MB46K21YZ',
};

// Singleton — evita inicialización doble en hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// [SEC-02] Exportaciones de servicios
export { app };

// Auth — importar getAuth en el módulo que lo necesite
// Firestore — importar getFirestore en el módulo que lo necesite
// Storage — importar getStorage en el módulo que lo necesite
// Patrón: import { getAuth } from 'firebase/auth'; → getAuth() usa el app singleton

// [SEC-03] FirebaseConnector legacy (mantiene interfaz anterior — R19)
export const FirebaseConnector = {

    /** @deprecated Stub legacy. La telemetría real irá por Firebase Functions en Fase 06. */
    checkFuelPressure() {
        return { status: 'OK', protocol: 'FIREBASE_V9_MODULAR', timestamp: Date.now() };
    },

    /** @deprecated Stub legacy — R19. */
    async sendTelegramAlert(payload) {
        console.log('[FirebaseConnector] EGRESS (stub legacy)', payload);
        return Promise.resolve({ success: true, tracking_id: `EGRESS-AIP-${Date.now()}` });
    },
};

export default FirebaseConnector;
