export const offeringSchema = Object.freeze({
    vertical: "AIP",
    subVertical: "FinancialIntermediation",
    targetMarket: "B2B",
    itemFamilies: Object.freeze([
        Object.freeze({
            family: "ADVISORY",
            itemType: "Advisory_Deal",
            fields: Object.freeze(["deal_type", "valuation_method", "due_diligence_status", "target_value"])
        }),
        Object.freeze({
            family: "ASSET",
            itemType: "Trade_Asset",
            fields: Object.freeze(["asset_class", "grade", "origin", "incoterms", "quantity_mt", "risk_score"])
        }),
        Object.freeze({
            family: "TRADE_FINANCE",
            itemType: "Contract_Agreement",
            fields: Object.freeze(["instrument_type", "counterparty_risk", "compliance_check", "custodian_bank"])
        })
    ]),
    gatekeeper_extensions: Object.freeze({
        kyc_required: true,
        jurisdiction_check: true,
        compliance_verified_gate: true
    })
});
export default offeringSchema;
