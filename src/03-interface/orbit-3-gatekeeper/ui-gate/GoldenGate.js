// %[CARRIL-AIP-INTERFACE] - [Fase 18.3]
/**
 * GoldenGate.js (v2 - Audit Corrected)
 * Componente Visual de la Aduana Fiduciaria.
 * R2 (Light DOM) | R4 (i18n Strict) | R3 (Zero-Hex) | R28 (UIBinder Symbiosis)
 */

/**
 * GoldenGate: El template de la barrera física de entrada.
 * Soberanía i18n Total: Sin texto hardcodeado.
 */
export const GoldenGate = {
    
    /**
     * Genera el fragmento HTML del componente de acceso.
     * @returns {string} Template HTML estéril con placeholders canónicos (—).
     */
    render() {
        return `
        <div id="secure-gate-modal" 
             class="fixed inset-0 z-[100] bg-[var(--theme-deep-ocean)]/95 backdrop-blur-2xl flex flex-col items-center justify-center hidden opacity-0 transition-opacity duration-700">
            
            <div class="text-center flex flex-col items-center max-w-md w-full p-12 border border-[var(--theme-border)] bg-[var(--theme-surface)]/10 backdrop-blur-md rounded-sm shadow-2xl">
                
                <!-- SIMBOLOGÍA DE SEGURIDAD -->
                <div class="relative mb-10">
                    <span id="sg-icon" 
                          class="material-symbols-outlined text-[var(--theme-accent)] text-7xl animate-pulse">
                        shield_lock
                    </span>
                    <div class="absolute inset-0 bg-[var(--theme-accent)]/20 blur-2xl rounded-full -z-10"></div>
                </div>
                
                <!-- MONITOR DE ESTADO (SSoT i18n) -->
                <h2 id="sg-status" 
                    class="text-[10px] uppercase tracking-[0.5em] text-[var(--theme-foreground-alt)] font-mono mb-12 transition-colors duration-500" 
                    data-i18n="gatekeeper.status.auditing">—</h2>
                
                <!-- TELEMETRÍA VISUAL (BARRA DE PROGRESO) -->
                <div id="sg-progress-container" 
                     class="w-full h-0.5 bg-[var(--theme-surface-alt)]/30 border-x border-[var(--theme-border)] overflow-hidden relative mb-12">
                    <div id="sg-progress-bar" 
                         class="absolute inset-y-0 left-0 bg-[var(--theme-accent)] w-1/4 animate-[pulse_3s_ease-in-out_infinite] transition-all duration-1000">
                    </div>
                </div>

                <!-- CONDUCTOS DE ACCIÓN (Simbiosis con UIBinder) -->
                <div id="sg-actions" class="flex flex-col gap-6 w-full">
                    <button type="button" 
                            class="px-8 py-5 bg-[var(--theme-accent)]/5 border border-[var(--theme-accent)] text-[var(--theme-accent)] text-[11px] uppercase tracking-[0.4em] font-bold hover:bg-[var(--theme-accent)] hover:text-[var(--theme-deep-ocean)] transition-all duration-500 group"
                            data-action="RequestAccess">
                        <span data-i18n="gatekeeper.action.request">—</span>
                    </button>
                    
                    <button type="button" 
                            class="text-[9px] uppercase tracking-[0.3em] text-[var(--theme-foreground-alt)]/60 hover:text-[var(--theme-accent)] transition-colors duration-300"
                            data-action="CancelAccess"
                            data-i18n="gatekeeper.action.cancel">—</button>
                </div>
                
                <!-- SELLO DE COMPLIANCE -->
                <div class="mt-16 pt-8 border-t border-[var(--theme-border)]/30 w-full">
                    <p class="text-[8px] uppercase tracking-[0.25em] text-[var(--theme-foreground-alt)]/30 leading-relaxed" 
                       data-i18n="gatekeeper.footer.compliance">—</p>
                </div>
            </div>
        </div>
        `;
    }
};

export default GoldenGate;
