/**
 * vertical.config.js
 * Contrato de Identidad de la Vertical AIP.
 * Doctrina: COG-64 | R5 (Zero-Leak) | R27 (Fusión Inmutable).
 */

export const config = Object.freeze({
    tenant_id: 'aip',
    APP_PREFIX: 'AIP_LANDING_V0_',
    offeringConfig: Object.freeze({
        name: 'AIP Financial & Commodities',
        version: '1.2.1',
        features: Object.freeze([])
    })
});

export default config;
