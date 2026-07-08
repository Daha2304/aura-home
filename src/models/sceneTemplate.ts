import type { ID, IconName, Timestamp } from "./common";
import type { SceneAction, SceneCategory, SceneParameter } from "./scene";

/**
 * A reusable scene blueprint. Templates are their own registry-backed
 * entity — instantiating one produces a regular Scene through the
 * SceneManager. No UI is required in Teil 8; this is the data & registry
 * layer only.
 */
export interface SceneTemplate {
  id: ID;
  uuid: string;
  name: string;
  description?: string;
  icon: IconName;
  color?: string;
  category: SceneCategory;
  tags: string[];
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** True if the template ships built-in and cannot be deleted. */
  builtin?: boolean;
  parameters: SceneParameter[];
  /** Action templates. `parameterRef` on actions binds to `parameters[].key`. */
  actions: SceneAction[];
}
