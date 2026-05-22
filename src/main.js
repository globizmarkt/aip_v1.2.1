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
import { UIHydrator } from './03-interface/ui-hydrator.js'; // [E3-GENESIS] PV-04 sutura
import { deepFreeze } from 'core/utils/deepFreeze.js'; // [E3-GENESIS] E3-T08 — canónico R27
import { Router } from './03-interface/orchestrator/Router.js'; // [REBORN-02] Orquestador de bus R20

/**
 * Whitelist de Verticales Autorizadas (COG-64)
 * Solo las verticales listadas aquí pueden ser cargadas dinámicamente.
 */
const ALLOWED_VERTICALS = ['aip', '_base', 'commodities'];

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

        // Carga y Fusión de Schemas (Modelo Híbrido Estricto - SCHEMA-01)
        console.log('0. [Schema] Cargando y fusionando contrato de schemas...');
        const baseSchemaModule = await import(`./verticals/_base/schemas/offeringSchema.js`);
        const baseSchema = baseSchemaModule.offeringSchema || baseSchemaModule.default;
        const vertSchemaModule = await import(`./verticals/${vertical}/schemas/offeringSchema.js`);
        const vertSchema = vertSchemaModule.offeringSchema || vertSchemaModule.default;

        // Fusión runtime: Chasis Base + ADN Vertical
        const mergedSchema = {
            ...vertSchema,
            vertical: vertSchema.vertical || vertical.toUpperCase(),
            itemFamilies: vertSchema.itemFamilies || [],
            gatekeeper_extensions: {
                ...vertSchema.gatekeeper_extensions,
                ...baseSchema.gatekeeper_extensions
            },
            MIN_INTEGRITY: 60 // Hard override inmutable (R15)
        };

        // R27: Inmutabilidad recursiva — deepFreeze canónico importado (E3-T08)
        deepFreeze(mergedSchema);
        window.Skeleton.offeringSchema = mergedSchema;
        console.log('0. [Schema] Fusión híbrida de schemas inyectada y sellada.');

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
        window.Skeleton.i18n = i18nEngine; // Exposición canónica (COG-66)
        console.log('5. [i18n] Hidratación inicial ejecutada para:', currentLang.toUpperCase());

        // 6. Aplicación de Vigilancia Inicial y señal de sistema listo
        gateEnforcer.enforce(identity);
        document.dispatchEvent(new CustomEvent('Skeleton:SystemReady', {
            detail: { identity, locale: currentLang, vertical },
            bubbles: true,
        }));
        console.log('6. [Compliance] Vigilancia aplicada. 🟢 Skeleton:SystemReady emitido.');

        // 7. Activación del Bus de Enrutamiento (inmediatamente tras SystemReady)
        Router.init();
        console.log('7. [Router] Enrutador de bus activo.');

        // Nota: el handler de vertical (ej. AIPHandler.js) es inicializado por ignition.js
        // al recibir Skeleton:SystemReady — evitar doble init aquí (R28).

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
