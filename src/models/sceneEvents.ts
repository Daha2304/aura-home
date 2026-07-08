import type { ID } from "./common";
import type { Scene } from "./scene";
import type { SceneExecution } from "./sceneExecution";

export interface SceneEvents {
  sceneCreated: { scene: Scene };
  sceneUpdated: { scene: Scene; previous: Scene };
  sceneDeleted: { id: ID };
  sceneExecuted: { execution: SceneExecution };
  sceneExecutionStarted: { execution: SceneExecution };
  sceneExecutionProgress: { execution: SceneExecution };
  sceneExecutionCompleted: { execution: SceneExecution };
  sceneExecutionFailed: { execution: SceneExecution; reason: string };
  scenesImported: { count: number };
  changed: void;
}
