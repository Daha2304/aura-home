import type { ID, Timestamp } from "./common";
import type { Scene } from "./scene";

/**
 * A stored snapshot of a Scene. Persisted per scene as a bounded ring
 * buffer by the SceneVersionStore.
 */
export interface SceneVersion {
  id: ID;
  sceneId: ID;
  versionNumber: number;
  createdAt: Timestamp;
  createdBy?: string;
  /** Full Scene payload minus the mutable `version` field. */
  payload: Omit<Scene, "version">;
}
