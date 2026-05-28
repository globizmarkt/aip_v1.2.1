/**
 * @file register-components.js
 * @description Cargador idempotente y Allowlist de Web Components para AIP v1.3.
 * Actúa como guardián de la infraestructura de interfaz:
 * — Solo los componentes registrados aquí pueden ser montados por el Router.
 * — Verifica existencia antes de registrar (idempotencia nativa del navegador).
 * — Soporta carga lazy diferida para componentes fuera del viewport inicial.
 *
 * Doctrina R2 (Light DOM Estricto): los componentes registrados aquí no usan Shadow DOM.
 * Doctrina R0 (Zero-Trust): el registro no escribe estado — solo declara capacidades.
 */

// ─── Estado interno del registro ────────────────────────────────────────────

/** @type {Map<string, { loader: () => Promise<void>, status: 'pending'|'loading'|'defined'|'error' }>} */
const _registry = new Map();

// ─── Validación ──────────────────────────────────────────────────────────────

/**
 * Valida que el tag-name cumple la especificación de Custom Elements:
 * debe contener al menos un guión y no empezar con un carácter reservado.
 * @param {string} tag
 * @returns {boolean}
 */
function _isValidTagName(tag) {
    return typeof tag === 'string' && /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(tag);
}

// ─── API pública ─────────────────────────────────────────────────────────────

export const ComponentRegistry = {

    /**
     * Registra un componente con carga eager (inmediata).
     * Si el tag ya está definido en el navegador, la operación es un no-op.
     * @param {string} tag - Tag-name del Custom Element (ej. 'aip-legal-attestation').
     * @param {() => Promise<void>} loader - Función que importa el módulo del componente.
     */
    register(tag, loader) {
        if (!_isValidTagName(tag)) {
            console.error(`[Registry] Tag inválido rechazado: '${tag}'`);
            return;
        }

        if (customElements.get(tag)) {
            // Ya definido en el navegador — idempotencia garantizada
            _registry.set(tag, { loader, status: 'defined' });
            return;
        }

        if (_registry.has(tag)) {
            // Ya en el registro interno (carga en curso o pendiente)
            return;
        }

        _registry.set(tag, { loader, status: 'loading' });

        loader()
            .then(() => {
                _registry.set(tag, { loader, status: 'defined' });
                console.log(`[Registry] Componente registrado: <${tag}>`);
            })
            .catch(err => {
                _registry.set(tag, { loader, status: 'error' });
                console.error(`[Registry] Error al cargar <${tag}>:`, err);
            });
    },

    /**
     * Registra un componente con carga lazy (diferida).
     * El módulo no se importa hasta que se llame a ensureDefined() o resolveVisibleLazy().
     * @param {string} tag
     * @param {() => Promise<void>} loader
     */
    registerLazy(tag, loader) {
        if (!_isValidTagName(tag)) {
            console.error(`[Registry] Tag inválido rechazado (lazy): '${tag}'`);
            return;
        }

        if (customElements.get(tag) || _registry.has(tag)) {
            return;
        }

        _registry.set(tag, { loader, status: 'pending' });
    },

    /**
     * Garantiza que un componente está definido en el navegador.
     * Si está pendiente (lazy), dispara la carga inmediatamente.
     * @param {string} tag
     * @returns {Promise<void>}
     */
    async ensureDefined(tag) {
        if (customElements.get(tag)) {
            return; // Ya en el navegador
        }

        const entry = _registry.get(tag);
        if (!entry) {
            console.warn(`[Registry] ensureDefined: '${tag}' no está en el registro.`);
            return;
        }

        if (entry.status === 'pending') {
            // Elevar de lazy a loading
            _registry.set(tag, { ...entry, status: 'loading' });
            try {
                await entry.loader();
                _registry.set(tag, { ...entry, status: 'defined' });
            } catch (err) {
                _registry.set(tag, { ...entry, status: 'error' });
                console.error(`[Registry] Error al cargar <${tag}>:`, err);
            }
        }

        // Si status es 'loading', esperar a que el navegador lo registre
        if (entry.status === 'loading') {
            await customElements.whenDefined(tag);
        }
    },

    /**
     * Resuelve todos los componentes lazy que tengan instancias ya presentes en el DOM.
     * Útil para hidratar el DOM en SSR o tras una navegación con restore-scroll.
     * @returns {Promise<void[]>}
     */
    resolveVisibleLazy() {
        const pending = [..._registry.entries()]
            .filter(([, entry]) => entry.status === 'pending')
            .filter(([tag]) => document.querySelector(tag) !== null);

        return Promise.all(pending.map(([tag]) => this.ensureDefined(tag)));
    },

    /**
     * Verifica si un tag está en el registro interno (no necesariamente definido aún).
     * @param {string} tag
     * @returns {boolean}
     */
    has(tag) {
        return _registry.has(tag) || !!customElements.get(tag);
    },

    /**
     * Devuelve el inventario completo del registro en un momento dado.
     * @returns {Array<{ tag: string, status: string, browserDefined: boolean }>}
     */
    getInventory() {
        return [..._registry.entries()].map(([tag, entry]) => ({
            tag,
            status: entry.status,
            browserDefined: !!customElements.get(tag)
        }));
    },

    /**
     * Emite un reporte de auditoría al console.
     * Útil para diagnóstico en desarrollo.
     */
    audit() {
        const inventory = this.getInventory();
        const defined  = inventory.filter(e => e.status === 'defined').length;
        const pending  = inventory.filter(e => e.status === 'pending').length;
        const loading  = inventory.filter(e => e.status === 'loading').length;
        const errored  = inventory.filter(e => e.status === 'error').length;

        console.group('[Registry] Auditoría de componentes');
        console.log(`Total: ${inventory.length} | Definidos: ${defined} | Pendientes: ${pending} | Cargando: ${loading} | Error: ${errored}`);
        inventory.forEach(({ tag, status, browserDefined }) => {
            const icon = status === 'defined' ? '✅' : status === 'error' ? '🔴' : status === 'loading' ? '🟡' : '⏳';
            console.log(`  ${icon} <${tag}> [${status}]${browserDefined ? ' (browser)' : ''}`);
        });
        console.groupEnd();
    }
};
