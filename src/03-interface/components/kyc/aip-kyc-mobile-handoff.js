// ============================================================
// ARCHIVO  : aip-kyc-mobile-handoff.js
// VERSIÓN  : 0.1.0 (BLUEPRINT — no wired, no producción)
// FECHA    : 2026-07-09
// PROPÓSITO: Boceto del flujo JS que ejecutaría la vista móvil servida al
//            escanear el QR de handoff KYC (despacho .68 Fase 3, Bloque C.2,
//            Lead Architect). Documenta la secuencia de llamadas a las
//            Cloud Functions kycInit/kycAttest — NO es un componente montado,
//            NO tiene vista/HTML asociada todavía, NO firma criptográficamente
//            (signedChallenge es un placeholder de texto).
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones
// [SEC-02] executeMobileHandoff — secuencia de llamadas (blueprint)

// [SEC-01] Importaciones
import { getFunctions, httpsCallable } from 'firebase/functions';

// [SEC-02] executeMobileHandoff — secuencia de llamadas (blueprint)
// Pendiente antes de producción:
//   1. Vista/página real servida en la URL que codifica el QR (hoy no existe).
//   2. Captura de cámara + subida a Storage (comentado abajo, sin implementar).
//   3. Firma criptográfica real del challenge (hoy: placeholder de texto).
//   4. Sin esta vista, MOBILE_UPLOAD_BASE en aip-kyc-individual.js sigue
//      apuntando a un dominio de ejemplo — no tocado por este despacho.
export async function executeMobileHandoff(sessionId) {
    try {
        const functions = getFunctions();

        // 1. Iniciar KYC Handoff
        const initFn = httpsCallable(functions, 'kycInit');
        const { data: initData } = await initFn({
            sessionId,
            deviceInfo: { userAgent: navigator.userAgent },
        });

        console.log('[Mobile] Sesión verificada. Challenge recibido:', initData.challenge);

        // 2. Aquí el usuario realiza la captura fotográfica y subida a Storage
        // ... Lógica de cámara y uploadBytes() — SIN IMPLEMENTAR ...
        // ... (placeholder de firma criptográfica para la prueba) ...
        const signedChallenge = `signed_${initData.challenge}`;

        // 3. Atestiguar cierre de captura
        const attestFn = httpsCallable(functions, 'kycAttest');
        await attestFn({
            sessionId,
            signedChallenge,
            mobilePubKey: 'dummy_pub_key',
        });

        console.log('[Mobile] Proceso completado. Desktop notificado.');
        // TODO: mostrar UI de éxito en móvil — sin vista todavía.
    } catch (err) {
        console.error('[Mobile] Error en flujo handoff:', err);
    }
}
