// %[CARRIL-AIP-ORQUESTRATOR] - [Fase 18.4]
/**
 * main.js
 * Orquestador Central del Chasis AIP v1.2.1.
 * Doctrina: Cascada Fiduciaria | Ley II (Re-hidratación)
 */

import { StorageAdapter } from 'infra/storage/StorageAdapter.js';
import { i18nEngine } from 'core/i18n/i18n-engine.js';
import { PassportEngine } from 'core/passport/PassportEngine.js';
import { UIBinder } from 'shared/UIBinder.js';
import { enforceProjectGate } from 'ui/orbit-3-gatekeeper/gateEnforcer.js';
const gateEnforcer = {
    init: () => {},
    enforce: (identity) => enforceProjectGate({ clearanceRequired: identity?.clearanceLevel || 'BRONZE' })
};
import { GoldenGate } from 'ui/orbit-3-gatekeeper/ui-gate/GoldenGate.js';

/**
 * Whitelist de Verticales Autorizadas (COG-64)
 * Solo las verticales listadas aquí pueden ser cargadas dinámicamente.
 */
const ALLOWED_VERTICALS = ['aip', '_base'];

/**
 * Secuencia de Arranque (Bootload)
 * Orquestación agnóstica de verticales con blindaje R27.
 */
async function boot() {
    console.group('[SKELETON-BOOTLOADER] Cascada de Encendido Iniciada');
    
    try {
        // 0. Identificación y Carga del Contrato de Vertical (COG-64)
        const vertical = window.Skeleton?.ENV?.vertical;
        if (!vertical || !ALLOWED_VERTICALS.includes(vertical)) {
            throw new Error(`[Skeleton] Acceso Denegado: Vertical '${vertical}' no autorizada.`);
        }

        console.log(`0. [Contract] Cargando contrato para vertical: ${vertical.toUpperCase()}`);
        
        // Importación dinámica del contrato
        const module = await import(`./verticals/${vertical}/vertical.config.js`);
        const config = module.config || module.default;

        if (!config || !config.APP_PREFIX) {
            throw new Error(`[Skeleton] Contrato inválido en vertical: ${vertical}`);
        }

        // Sellado de Configuración (R27)
        Object.freeze(config);
        window.Skeleton.CONFIG = config;
        console.log('0. [Contract] Configuración inyectada y sellada (R27).');

        // 1. Inicialización de Infraestructura (Órbita 2)
        StorageAdapter.init(config.APP_PREFIX);
        console.log('1. [Infra] StorageAdapter inicializado.');

        // 2. Inyección Visual (Órbita 3)
        document.body.insertAdjacentHTML('beforeend', GoldenGate.render());
        console.log('2. [GoldenGate] Inyectado en el DOM.');

        // 3. Despertar Motores UI (Órbita 3)
        UIBinder.init();
        gateEnforcer.init();
        console.log('3. [Sensors] UIBinder y gateEnforcer activos.');

        // 4. Lectura de Identidad (Órbita 1)
        const identity = PassportEngine.getIdentity();
        console.log('4. [Identity] Soberanía reconocida:', identity.archetype);

        // 5. Hidratación Lingüística (Ley II)
        const currentLang = i18nEngine.getLocale();
        i18nEngine.setLocale(currentLang);
        console.log('5. [i18n] Hidratación inicial ejecutada para:', currentLang.toUpperCase());

        // 6. Aplicación de Vigilancia Inicial y señal de sistema listo
        gateEnforcer.enforce(identity);
        document.dispatchEvent(new CustomEvent('Skeleton:SystemReady', {
            detail: { identity, locale: currentLang, vertical },
            bubbles: true,
        }));
        console.log('6. [Compliance] Vigilancia aplicada. 🟢 Skeleton:SystemReady emitido.');

    } catch (error) {
        console.error('[SKELETON-BOOTLOADER] Fallo crítico en la cascada:', error);
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
