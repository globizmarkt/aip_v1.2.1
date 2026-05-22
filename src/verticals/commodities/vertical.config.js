/**
 * vertical.config.js
 * Contrato de Identidad de la Vertical.
 * Doctrina: COG-64 | R5 (Zero-Leak) | R27 (Fusión Inmutable).
 */

export const config = Object.freeze({
    tenant_id: 'commodities_v1',
    APP_PREFIX: 'SKELETON_COMM_V1_',
    offeringConfig: Object.freeze({
        name: 'Commodities Trading',
        version: '1.0.0',
        features: Object.freeze([])
    })
});

export default config;
