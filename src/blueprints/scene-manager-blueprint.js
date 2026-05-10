// %[CARRIL-AIP-BLUEPRINT] - [Fase 18.3] - [scene-manager-blueprint.js]
/**
 * BLUEPRINT: SceneManager
 * Propósito: Plantilla de gemación para el Motor de Escenas.
 * Doctrina: Zero-DOM. Emite eventos Skeleton: — nunca toca el DOM directamente.
 *
 * USO EN GEMACIÓN:
 *   1. Copiar este archivo a src/01-core/scene-manager.js de la vertical.
 *   2. Ajustar APP_PREFIX para coincidir con StorageAdapter de la vertical.
 *   3. Registrar las escenas disponibles en SCENES.
 */

const APP_PREFIX = '__VERTICAL_PREFIX__'; // ← REEMPLAZAR en gemación

const SCENES = {
    LANDING:  '__SCENE_LANDING__',   // ← REEMPLAZAR
    GATE:     '__SCENE_GATE__',      // ← REEMPLAZAR
    WORKSPACE:'__SCENE_WORKSPACE__', // ← REEMPLAZAR
};

const INITIAL_SCENE = SCENES.LANDING;

const SceneManager = (() => {
    const STORAGE_KEY = `${APP_PREFIX}_current_scene`;

    function getScene() {
        return sessionStorage.getItem(STORAGE_KEY) || INITIAL_SCENE;
    }

    function setScene(sceneName) {
        if (!Object.values(SCENES).includes(sceneName)) {
            console.error(`[SceneManager] Escena desconocida: ${sceneName}`);
            return;
        }
        sessionStorage.setItem(STORAGE_KEY, sceneName);
        document.dispatchEvent(new CustomEvent('Skeleton:SceneChanged', {
            detail: { scene: sceneName },
            bubbles: true,
        }));
        console.log(`[SceneManager] Escena → ${sceneName}`);
    }

    function init() {
        const current = getScene();
        document.dispatchEvent(new CustomEvent('Skeleton:SceneReady', {
            detail: { scene: current },
            bubbles: true,
        }));
        console.log(`[SceneManager] Inicializado. Escena activa: ${current}`);
    }

    return { init, getScene, setScene, SCENES };
})();

export { SceneManager };
