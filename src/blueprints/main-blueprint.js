// %[CARRIL-AIP-BLUEPRINT] - [Fase 18.3] - [main-blueprint.js]
/**
 * BLUEPRINT: main.js (Bootloader Soberano)
 * Propósito: Plantilla de gemación para el orquestador de arranque de una vertical.
 * Doctrina: Cascada Fiduciaria | PSB (Protocolo Sovereign Bootload).
 *
 * SECUENCIA OBLIGATORIA (No alterar el orden — Ley II):
 *   1. Inyección Visual   → GoldenGate.render() en el DOM
 *   2. Sensores UI        → UIBinder.init() + gateEnforcer.init()
 *   3. Identidad          → PassportEngine.getIdentity()
 *   4. Hidratación i18n   → i18nEngine.setLocale() (Ley II: Re-hidratación Post-Inyección)
 *   5. Vigilancia         → gateEnforcer.enforce(identity) + evento SystemReady
 *
 * USO EN GEMACIÓN:
 *   1. Copiar a src/main.js de la nueva vertical.
 *   2. Ajustar los import paths para que coincidan con el importmap de la vertical.
 *   3. El importmap en index.html debe mapear: 'core/', 'infra/', 'shared/', 'ui/'.
 */

import { i18nEngine }    from 'core/i18n/i18n-engine.js';
import { PassportEngine } from 'core/passport/PassportEngine.js';
import { UIBinder }      from 'shared/UIBinder.js';
import { gateEnforcer }  from 'ui/orbit-3-gatekeeper/gateEnforcer.js';
import { GoldenGate }    from 'ui/orbit-3-gatekeeper/ui-gate/GoldenGate.js';

async function boot() {
    console.group('[AIP-BOOTLOADER] Cascada Fiduciaria — Iniciada');

    try {
        // PASO 1 — Inyección Visual (Órbita 3 / Los Sentidos)
        document.body.insertAdjacentHTML('beforeend', GoldenGate.render());
        console.log('1. [GoldenGate] Shell visual inyectada.');

        // PASO 2 — Activación de Sensores UI (Órbita 3)
        UIBinder.init();
        gateEnforcer.init();
        console.log('2. [Sensors] UIBinder y gateEnforcer activos.');

        // PASO 3 — Lectura de Identidad (Órbita 1 / La Mente)
        const identity = PassportEngine.getIdentity();
        console.log('3. [Identity] Arquetipo reconocido:', identity.archetype);

        // PASO 4 — Hidratación Lingüística (Ley II: Re-hidratación Post-Inyección)
        const locale = i18nEngine.getLocale();
        await i18nEngine.setLocale(locale);
        console.log('4. [i18n] Hidratación completada:', locale.toUpperCase());

        // PASO 5 — Aplicar Vigilancia y Emitir SystemReady
        gateEnforcer.enforce(identity);
        document.dispatchEvent(new CustomEvent('Skeleton:SystemReady', {
            detail: { identity, locale },
            bubbles: true,
        }));
        console.log('5. [Compliance] Vigilancia aplicada. Sistema listo.');

    } catch (error) {
        console.error('[AIP-BOOTLOADER] Fallo crítico en cascada:', error);
        document.dispatchEvent(new CustomEvent('Skeleton:BootFailed', {
            detail: { error: error.message },
            bubbles: true,
        }));
    }

    console.groupEnd();
}

// Auto-ejecución segura — respeta el estado del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
