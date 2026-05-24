// %[CARRIL-AIP-ORQUESTRATOR] - [Fase 18.4]
/**
 * main.js
 * Orquestador Central del Chasis AIP v1.2.1.
 * Doctrina: Cascada Fiduciaria | Ley II (Re-hidratación)
 */

import { StorageAdapter } from 'infra/storage/StorageAdapter.js';
import { i18nEngine } from 'core/i18n/i18n-engine.js';
import { PassportEngine } from 'core/passport/PassportEngine.js';
import UIBinder from 'shared/UIBinder.js'; // default export = singleton new UIBinder() — init() es método de instancia, no estático
import { enforceProjectGate } from 'ui/orbit-3-gatekeeper/gateEnforcer.js';
const gateEnforcer = {
    init: () => {},
    enforce: (identity) => enforceProjectGate({ clearanceRequired: identity?.clearanceLevel || 'BRONZE' })
};
import { GoldenGate } from 'ui/orbit-3-gatekeeper/ui-gate/GoldenGate.js';
import { UIHydrator } from './03-interface/ui-hydrator.js'; // [E3-GENESIS] PV-04 sutura
import { deepFreeze } from 'core/utils/deepFreeze.js'; // [E3-GENESIS] E3-T08 — canónico R27
import { Router } from './03-interface/orchestrator/Router.js'; // [REBORN-02] Orquestador de bus R20
import { TabLoader } from './03-interface/TabLoader.js';        // [TAB-INJ-01] Inyección de gadgets de landing
import sessionGC from 'core/sessionGC.js';                      // [E3-T03] Recolector de Basura Fiduciaria
import { GenesisWizard } from './03-interface/wizards/GenesisWizard.js'; // [E3-T01] Esclusa del Golden Gate
import { LegalModal } from './03-interface/wizards/LegalModal.js';    // [E3-T02] Guardián legal fluido

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
        // [E3-T03] SessionGC — Recolector de Basura Fiduciaria
        // Ejecutar ANTES de cualquier lectura de storage. Purga legacy + valida TTL AnonProjectState.
        sessionGC.init();
        console.log('[SessionGC] Recolector fiduciario activo. Residuos legacy purgados.');

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

        // 8. [TAB-INJ-01] Activación del motor de inyección de gadgets de landing
        TabLoader.init();
        console.log('8. [TabLoader] Motor de inyección de tabs activo.');

        // 9. [E3-T01] Esclusa del Golden Gate — Sovereign Confirm + Teatro de Seguridad
        GenesisWizard.init();
        console.log('9. [GenesisWizard] Esclusa inicializada. Botón GateWake en espera.');

        // 10. [E3-T02] Guardián legal fluido — atestación institucional post-cruce
        LegalModal.init();
        console.log('10. [LegalModal] Guardián legal fluido activo.');

        // [E3-T01] Transición de vista al cruzar el Golden Gate — oculta landing, LegalModal aparece
        document.addEventListener('Skeleton:Action:GateCrossed', () => {
            document.getElementById('orbit-3')?.classList.remove('active');
            document.getElementById('orbit-2-main-content')?.classList.add('hidden');
            document.getElementById('tab-content-container')?.classList.add('hidden');
            console.log('[Main] Golden Gate cruzado → Guardián legal fluido activado.');
        }, { once: true });

        // [E3-T02] Revelación del CRM Dashboard tras atestación legal
        document.addEventListener('Skeleton:Legal:Accepted', () => {
            document.body.classList.add('crm-mode');                          // Activa paleta CRM + elimina background-image (Bloque A)
            document.getElementById('crm-dashboard')?.classList.remove('hidden');
            console.log('[Main] Atestación legal completada → CRM Dashboard visible. body.crm-mode activado.');
        }, { once: true });

        // [E3-T02] Sincronización de idioma desde el selector de landing
        document.addEventListener('Skeleton:Action:LanguageChange', (e) => {
            const lang = e.detail?.lang;
            if (!lang) return;
            i18nEngine.setLocale(lang);
            const raw = sessionStorage.getItem('AnonProjectState');
            if (raw) {
                try {
                    const state = JSON.parse(raw);
                    state.locale = lang;
                    state.last_updated = Date.now();
                    sessionStorage.setItem('AnonProjectState', JSON.stringify(state));
                } catch { /* JSON corrupto — sessionGC lo purgará */ }
            }
            console.log(`[Main] Idioma sincronizado → ${lang.toUpperCase()}`);
        });

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
