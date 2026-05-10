// %[CARRIL-AIP-ORQUESTRATOR] - [Fase 18.4]
/**
 * main.js
 * Orquestador Central del Chasis AIP v1.2.1.
 * Doctrina: Cascada Fiduciaria | Ley II (Re-hidratación)
 */

import { i18nEngine } from 'core/i18n/i18n-engine.js';
import { PassportEngine } from 'core/passport/PassportEngine.js';
import { UIBinder } from 'shared/UIBinder.js';
import { gateEnforcer } from 'ui/orbit-3-gatekeeper/gateEnforcer.js';
import { GoldenGate } from 'ui/orbit-3-gatekeeper/ui-gate/GoldenGate.js';

/**
 * Secuencia de Arranque (Bootload)
 * Orquestación estricta de la mente, sentidos y barreras.
 */
async function boot() {
    console.group('[AIP-BOOTLOADER] Cascada de Encendido Iniciada');
    
    try {
        // 1. Inyección Visual (Órbita 3)
        // Insertamos la Aduana física antes de activar los motores.
        document.body.insertAdjacentHTML('beforeend', GoldenGate.render());
        console.log('1. [GoldenGate] Inyectado en el DOM.');

        // 2. Despertar Motores UI (Órbita 3)
        UIBinder.init();
        gateEnforcer.init();
        console.log('2. [Sensors] UIBinder y gateEnforcer activos.');

        // 3. Lectura de Identidad (Órbita 1)
        const identity = PassportEngine.getIdentity();
        console.log('3. [Identity] Soberanía reconocida:', identity.archetype);

        // 4. Hidratación Lingüística (Ley II)
        // Forzamos la señal de cambio de idioma para que el traductor legacy hidrate los em dash (—).
        const currentLang = i18nEngine.getLocale();
        i18nEngine.setLocale(currentLang);
        console.log('4. [i18n] Hidratación inicial ejecutada para:', currentLang.toUpperCase());

        // 5. Aplicación de Vigilancia Inicial y señal de sistema listo
        gateEnforcer.enforce(identity);
        document.dispatchEvent(new CustomEvent('Skeleton:SystemReady', {
            detail: { identity, locale: currentLang },
            bubbles: true,
        }));
        console.log('5. [Compliance] Vigilancia aplicada. 🟢 Skeleton:SystemReady emitido.');

    } catch (error) {
        console.error('[AIP-BOOTLOADER] Fallo crítico en la cascada:', error);
        document.dispatchEvent(new CustomEvent('Skeleton:BootFailed', {
            detail: { error: error.message },
            bubbles: true,
        }));
    }

    console.groupEnd();
}

// Auto-ejecución Segura tras carga del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
