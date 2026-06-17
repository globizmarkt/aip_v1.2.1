// ============================================================
// ARCHIVO  : kyc-flow-controller.js
// VERSIÓN  : 1.0.0
// FECHA    : 2026-06-14
// PROPÓSITO: Orquesta la cadena de eventos del pipeline KYC (Fase 0→4) del
//            yacimiento [N-34] ORB4-KYC. Escucha los eventos de "fase
//            completada" emitidos por cada componente de components/kyc/
//            y monta el siguiente componente de la secuencia en el
//            contenedor asignado.
// ============================================================
// DOCTRINA : R2 (Light DOM estricto) · R11 (PascalCase en eventos)
//            R20 (Event-Driven) · R0 (Zero-Trust — solo lee eventos,
//            no escribe en la FSM global de UserFSM)
// ORIGEN   : DIR-AIP-04 / yacimiento [N-34] — decisión 2 (controlador
//            dedicado para el encadenamiento Fase 0→4, validada por el
//            Director 2026-06-14)
// ============================================================

// ÍNDICE
// [SEC-01] Importaciones y dependencias
// [SEC-02] Configuración — pipeline de fases KYC
// [SEC-03] Estado interno
// [SEC-04] Lógica de negocio — montaje y avance de fase
// [SEC-05] API pública — init/destroy + listeners del bus de eventos
// [SEC-06] Exports

// [SEC-01] Importaciones y dependencias
import { ComponentRegistry } from '../../register-components.js';

// [SEC-02] Configuración — pipeline de fases KYC
// Cada fase escucha el evento "completeEvent" de la fase anterior para
// montarse. La primera fase (aip-kyc-setup) se monta directamente en init().
const KYC_PIPELINE = Object.freeze([
    { tag: 'aip-kyc-setup',      completeEvent: 'AIP:KYC:SetupComplete' },
    { tag: 'aip-acp-flow',       completeEvent: 'AIP:KYC:ACPConfirmed' },
    { tag: 'aip-kyc-individual', completeEvent: 'AIP:KYC:IndividualSubmitted' },
    { tag: 'aip-kyb-flow',       completeEvent: 'AIP:KYC:KYBSubmitted' },
    { tag: 'aip-l4-qualifier',   completeEvent: 'AIP:KYC:L4Submitted' },
]);

const FLOW_COMPLETE_EVENT = 'AIP:KYC:FlowComplete';

// [SEC-03] Estado interno
let _container = null;
let _bound = false;

// [SEC-04] Lógica de negocio — montaje y avance de fase
async function _mount(tag) {
    if (!_container) return;
    await ComponentRegistry.ensureDefined(tag);
    const el = document.createElement(tag);
    _container.replaceChildren(el);
    console.log(`[KYCFlowController] Fase montada: <${tag}>`);
}

function _advance(completedEvent) {
    const currentIndex = KYC_PIPELINE.findIndex(step => step.completeEvent === completedEvent);
    if (currentIndex === -1) return;

    const next = KYC_PIPELINE[currentIndex + 1];
    if (next) {
        _mount(next.tag);
        return;
    }

    // Última fase (L4Submitted) — pipeline KYC completo.
    _container?.replaceChildren();
    document.dispatchEvent(new CustomEvent(FLOW_COMPLETE_EVENT, { bubbles: true }));
    console.log(`[KYCFlowController] Pipeline KYC completo — ${FLOW_COMPLETE_EVENT} emitido.`);
}

// [SEC-05] API pública — init/destroy + listeners del bus de eventos
export const KYCFlowController = {
    /**
     * Inicializa el controlador con el contenedor DOM donde se monta cada
     * fase del pipeline KYC. Monta la primera fase (aip-kyc-setup) de inmediato.
     * @param {HTMLElement} container
     */
    init(container) {
        if (!container) {
            console.error('[KYCFlowController] Contenedor no encontrado — init abortado.');
            return;
        }
        _container = container;

        if (!_bound) {
            KYC_PIPELINE.forEach(step => {
                document.addEventListener(step.completeEvent, () => _advance(step.completeEvent));
            });
            _bound = true;
        }

        _mount(KYC_PIPELINE[0].tag);
    },

    /**
     * Limpia el contenedor y desvincula la referencia. Los listeners del
     * document permanecen activos (idempotentes — _container null = no-op).
     */
    destroy() {
        _container?.replaceChildren();
        _container = null;
    }
};

// [SEC-06] Exports
export default KYCFlowController;
