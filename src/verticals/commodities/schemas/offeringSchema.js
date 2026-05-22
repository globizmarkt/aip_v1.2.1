/**
 * offeringSchema.js
 * Schema base de oferta para todas las verticales.
 * Doctrina: R15 (Hard Gate) | R27 (Fusión Inmutable) | COG-64.
 * Toda vertical nueva hereda estos gates de seguridad por defecto.
 */

export const offeringSchema = Object.freeze({
    vertical: 'BASE',
    itemFamilies: Object.freeze([]),
    gatekeeper_extensions: Object.freeze({
        kyc_required: true,
        jurisdiction_check: true,
        compliance_verified_gate: true
    })
});

export default offeringSchema;
