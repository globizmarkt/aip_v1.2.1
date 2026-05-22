// %[CARRIL-AIP-QWEN] - [Sprint 18] - E1-T06
/**
 * UIBinder.js
 * Puente Fiduciario entre DOM ciego y Core.
 * R0 (Zero-Trust) | R11 (PascalCase) | R18 (ES Modules) | R20 (Event-Driven) | R25 (Zero-DOM) | R28 (Desacoplamiento)
 */

const FIDUCIARY_LATENCY = 1000; // ms (Rango doctrinal 800-1500)
const UI_LOCK_CLASSES = ['skeleton-blur', 'disabled'];

export class UIBinder {
    #lockedNodes = new WeakSet();
    #globalThrottle = false;

    /**
     * Inicializa la delegación de eventos sobre [data-action].
     */
    init() {
        console.log('[UIBinder] Puente fiduciario activo.');
        document.addEventListener('click', (e) => this.#dispatchInteraction(e, 'click'));
        document.addEventListener('submit', (e) => this.#dispatchInteraction(e, 'submit'));
    }

    #dispatchInteraction(e, type) {
        const trigger = e.target.closest('[data-action]');
        if (!trigger || this.#isBlocked(trigger)) return;
        if (type === 'submit') e.preventDefault();

        this.#lockTrigger(trigger);
        this.#globalThrottle = true;

        // Purificación estricta (R0/R28)
        const purified = this.#purify(trigger, type);

        // Emisión canónica (R11/R20) - Sintaxis obligatoria
        document.dispatchEvent(new CustomEvent('Skeleton:RequestGate', {
            detail: purified,
            bubbles: true,
            composed: true
        }));

        // Liberación post-latencia fiduciaria
        setTimeout(() => {
            this.#unlockTrigger(trigger);
            this.#globalThrottle = false;
        }, FIDUCIARY_LATENCY);
    }

    #isBlocked(node) {
        return this.#lockedNodes.has(node) || this.#globalThrottle;
    }

    #lockTrigger(node) {
        node.setAttribute('aria-disabled', 'true');
        node.classList.add(...UI_LOCK_CLASSES);
        this.#lockedNodes.add(node);
    }

    #unlockTrigger(node) {
        if (!node.isConnected) return;
        node.removeAttribute('aria-disabled');
        node.classList.remove(...UI_LOCK_CLASSES);
        this.#lockedNodes.delete(node);
    }

    #purify(element, type) {
        let raw = {};
        if (type === 'submit' && element.tagName === 'FORM') {
            const fd = new FormData(element);
            for (const [k, v] of fd.entries()) raw[k] = v;
        } else {
            raw = { ...element.dataset };
            // 'action' se preserva intencionalmente — Router.js lo consume para traducción Skeleton:Action:*
        }

        // Saneamiento R0: Trim, coerción segura, eliminación de vacíos
        const sanitized = {};
        for (const [key, value] of Object.entries(raw)) {
            const clean = String(value ?? '').trim();
            if (clean === '') continue;
            sanitized[key] = clean;
        }

        // Inmutabilidad R27/R28
        return Object.freeze(sanitized);
    }
}

export default new UIBinder();