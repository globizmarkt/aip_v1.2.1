/**
 * BLUEPRINT: UIBinder
 * Doctrina: Desacoplamiento R28 — Puente DOM → Core. Cero lógica de negocio.
 * El DOM emite intención (data-action). El Core decide. El UIBinder traduce.
 * Uso: generate({ throttleMs: 300 })
 */
export function generate(config) {
  const throttleMs = config.throttleMs ?? 300;
  return `
// ============================================================
// UIBinder — Generado por ui-binder-blueprint.js
// Throttle: ${throttleMs}ms
// ============================================================
const UIBinder = (() => {
  let _lastFired = 0;
  let _initialized = false;

  function _throttle(fn) {
    const now = Date.now();
    if (now - _lastFired < ${throttleMs}) return;
    _lastFired = now;
    fn();
  }

  function _dispatch(action, payload) {
    document.dispatchEvent(
      new CustomEvent('Skeleton:Action:' + action, {
        bubbles: false,
        detail: structuredClone(payload)
      })
    );
  }

  function _handleClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const raw = target.dataset.payload;
    const payload = raw ? JSON.parse(raw) : {};
    _throttle(() => _dispatch(action, payload));
  }

  function init() {
    if (_initialized) return;
    document.addEventListener('click', _handleClick, { passive: true });
    _initialized = true;
  }

  function destroy() {
    document.removeEventListener('click', _handleClick);
    _initialized = false;
  }

  return { init, destroy };
})();

export default UIBinder;
`.trimStart();
}
