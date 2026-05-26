/**
 * AIP Vertical Ignition — v1.1
 * Escucha Skeleton:SystemReady e hidrata el DOM con datos de demostración.
 * [SSoT] mockState.js es la única fuente de verdad para datos demo — eliminar demoData inline.
 * data-i18n: gestionado por 01-core/i18n/ — no duplicar aquí
 */

import { AIPHandler } from './AIPHandler.js';
import { mockState } from './mockState.js'; // [SSoT · E4] Única fuente de verdad para datos demo

document.addEventListener('Skeleton:SystemReady', async () => {

  // 1. Inicializar Handlers de la Vertical
  AIPHandler.init();

  // 2. Hidratación SSoT — mandatos y ticker desde mockState.js (no datos inline)
  document.dispatchEvent(new CustomEvent('Skeleton:HydrateVertical', {
    detail: { vertical: 'aip', data: { assets: mockState.mandates, ticker: mockState.ticker } }
  }));

  document.dispatchEvent(new CustomEvent('Skeleton:VerticalReady', {
    detail: { vertical: 'aip' }
  }));

});
