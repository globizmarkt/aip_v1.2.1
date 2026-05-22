// [E3-GENESIS] [Fase 19] [Antigravity] [E3-T08]
/**
 * deepFreeze.js
 * Utilidad canónica para Inmutabilidad Recursiva (Doctrina R27).
 * Previene la mutación de configuraciones fiduciarias y schemas en runtime.
 */
export const deepFreeze = (obj) => {
    const propNames = Object.getOwnPropertyNames(obj);
    for (const name of propNames) {
        const value = obj[name];
        if (value && typeof value === 'object') {
            deepFreeze(value);
        }
    }
    return Object.freeze(obj);
};
export default deepFreeze;
