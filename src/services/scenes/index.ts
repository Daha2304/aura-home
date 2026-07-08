export { sceneManager } from "./SceneManager";
export { sceneRegistry } from "./SceneRegistry";
export { sceneExecutor } from "./SceneExecutor";
export { sceneVersionStore } from "./SceneVersionStore";
export { sceneTemplateRegistry } from "./SceneTemplateRegistry";
export { sceneTemplateManager } from "./SceneTemplateManager";
export {
  sceneParameterRegistry,
  registerBuiltinSceneParameterTypes,
} from "./SceneParameterRegistry";
export { sceneEvents, groupEvents } from "./SceneEvents";
export { exportScenes, importScenes } from "./sceneSerialization";

import { sceneManager } from "./SceneManager";
import { sceneExecutor } from "./SceneExecutor";
import { registerBuiltinSceneParameterTypes } from "./SceneParameterRegistry";

export function bootstrapScenes(): void {
  registerBuiltinSceneParameterTypes();
  sceneManager.hydrate();
  sceneExecutor.start();
}
