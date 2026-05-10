/**
 * AIP Vertical Ignition — v1.0
 * Escucha Skeleton:SystemReady e hidrata el DOM con datos de demo
 * Zero-dependencies — datos inline hasta backend activo
 * data-i18n: gestionado por 01-core/i18n/ — no duplicar aquí
 */

document.addEventListener('Skeleton:SystemReady', async () => {

  const demoData = {
    assets: [
      { id: 'GOLD-001', type: 'Physical Gold — 400oz LBMA', score: 82, status: 'BANCABLE', kyc: 'L2', jurisdiction: 'CH' },
      { id: 'SBLC-007', type: 'SBLC — Top 25 EU Bank', score: 71, status: 'BANCABLE', kyc: 'L1', jurisdiction: 'NL' },
      { id: 'CRUDE-012', type: 'Crude Oil — D2 GOST', score: 58, status: 'UNDER_REVIEW', kyc: 'L1', jurisdiction: 'AE' }
    ],
    ticker: {
      xau: '$2,487 (+0.6%)',
      sofr: '5.31%',
      eur_chf: '0.9712 (-0.1%)'
    },
    agent: {
      name: 'Demo Agent',
      clearance: 'Silver',
      region: 'ES',
      integrity: 72
    }
  };

  document.dispatchEvent(new CustomEvent('Skeleton:HydrateVertical', {
    detail: { vertical: 'aip', data: demoData }
  }));

  document.dispatchEvent(new CustomEvent('Skeleton:VerticalReady', {
    detail: { vertical: 'aip' }
  }));

});
