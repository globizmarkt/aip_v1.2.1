// %[CARRIL-AIP-INTERFACE] - [Fase 18.3]
/**
 * UIBinder.js
 * Puente Fiduciario entre el DOM y el Core.
 * R28 (Decoupling) | R20 (Event-Driven) | R11 (Fiduciary Bus)
 */

/**
 * UIBinder: El sistema nervioso de la interfaz en la Órbita 3.
 * Centraliza la escucha del DOM y la traduce a eventos de sistema.
 */
export const UIBinder = {
    
    _isProcessing: false,
    _throttleTimeout: 300, // milisegundos de inhibición de doble disparo

    /**
     * Inicializa los sensores de la interfaz (Órbita 3).
     */
    init() {
        console.log('[UIBinder] Inicializando puente de eventos UI...');
        this._setupGlobalListeners();
        return this;
    },

    /**
     * Configura la delegación de eventos global.
     * Escucha elementos con el atributo 'data-action'.
     * @private
     */
    _setupGlobalListeners() {
        // Captura de Clicks (Acciones inmediatas)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (target) {
                this._handleAction(target, e);
            }
        });

        // Captura de Submits (Formularios Gatekeeper/KYC)
        document.addEventListener('submit', (e) => {
            const target = e.target.closest('[data-action]');
            if (target) {
                e.preventDefault();
                this._handleAction(target, e);
            }
        });
    },

    /**
     * Traduce una interacción física en una señal lógica para el Core.
     * Implementa protección contra doble disparo (Throttle fiduciario).
     * @param {HTMLElement} element - Nodo que disparó la acción.
     * @param {Event} originalEvent - Evento nativo del navegador.
     * @private
     */
    _handleAction(element, originalEvent) {
        if (this._isProcessing) {
            console.warn(`[UIBinder] Acción bloqueada por throttle: ${element.dataset.action}`);
            return;
        }

        const actionName = element.dataset.action;
        
        // Purificación del Payload (DNA Extraction)
        // Extrae todos los data-attributes excepto el propio action.
        const payload = { ...element.dataset };
        delete payload.action;

        // Si es un formulario, podemos recolectar sus datos aquí
        if (originalEvent.type === 'submit' && element.tagName === 'FORM') {
            const formData = new FormData(element);
            payload.formData = Object.fromEntries(formData.entries());
        }

        // Activación de protección
        this._isProcessing = true;
        
        console.log(`[UIBinder] Traduciendo acción DOM: ${actionName}`, payload);

        // Despacho de Evento Canónico Skeleton (R11)
        this.dispatch(`Skeleton:Action:${actionName}`, payload);

        // Reset de la barrera tras el periodo de inhibición
        setTimeout(() => {
            this._isProcessing = false;
        }, this._throttleTimeout);
    },

    /**
     * Emite una señal purificada al Bus Fiduciario (document).
     * @param {string} eventName - Nombre del evento con prefijo Skeleton:.
     * @param {Object} detail - Datos asociados a la señal.
     */
    dispatch(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { 
            detail,
            bubbles: true,
            composed: true 
        });
        document.dispatchEvent(event);
    }
};

export default UIBinder;
