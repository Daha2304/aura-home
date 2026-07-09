import type { ID, IconName, Timestamp } from "./common";

/** Categories used for scene grouping in the library. */
export type SceneCategory =
  | "light"
  | "climate"
  | "tv"
  | "music"
  | "away"
  | "home"
  | "sleep"
  | "wake"
  | "custom";

export type SceneErrorStrategy = "abort" | "continue" | "retry";

/**
 * Placeholder type used by scenes and (later) automations. Kept as
 * `unknown`-shaped so Teil 9 can define concrete conditions without
 * breaking existing scenes.
 */
export type SceneConditionRef = { ref: string; params?: Record<string, unknown> };

/**
 * A single action inside a Scene. Every action targets either a device
 * OR a group; the {@link SceneExecutor} resolves groups through the
 * generic {@link GroupResolver} before enqueueing commands.
 */
export interface SceneAction {
  /** Stable, per-action id — used for drag&drop, progress lookups, undo. */
  id: ID;
  /** Target device (mutually exclusive with `groupId`). */
  deviceId?: ID;
  /** Target group (mutually exclusive with `deviceId`). */
  groupId?: ID;
  /** Capability id (matches `Capability.id`, i.e. wire key). */
  capabilityId: string;
  /** Target value. Shape depends on capability. */
  targetValue: unknown;
  /** Snapshot of previous value captured at execution start — Undo prep. */
  previousValue?: unknown;
  /** Delay before this action fires, in ms. */
  delayMs: number;
  /** Higher value fires earlier when actions share the same delay. */
  priority: number;
  /** If true, siblings with the same delay run in parallel. */
  parallel: boolean;
  /** Optional actions may fail without failing the scene. */
  optional: boolean;
  /** Error strategy on failure. */
  errorStrategy: SceneErrorStrategy;
  /** Human-readable note. */
  comment?: string;
  /** Placeholder for Teil 9 conditions. Not evaluated yet. */
  condition?: SceneConditionRef;
  /** Optional reference to a SceneParameter (`SceneParameter.key`). */
  parameterRef?: string;

  // -------- Back-compat: legacy fields (older persisted scenes) --------
  /** @deprecated Use `targetValue`. Kept for migration from Part 3 scenes. */
  value?: unknown;
}

/**
 * Definition of a parameter a Scene (or Template) can carry. Prepared for
 * later evaluation — SceneExecutor does not resolve parameters yet.
 */
export type SceneParameterType =
  | "boolean"
  | "number"
  | "string"
  | "enum"
  | "device"
  | "group"
  | "capability"
  | "color";

export interface SceneParameter {
  id: ID;
  /** Stable machine key (referenced by `SceneAction.parameterRef`). */
  key: string;
  label: string;
  type: SceneParameterType;
  description?: string;
  required?: boolean;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
}

export interface Scene {
  id: ID;
  /** UUID-shaped stable identifier for exports/sharing. */
  uuid: string;
  name: string;
  description?: string;
  icon: IconName;
  color?: string;
  category: SceneCategory;
  favorite: boolean;
  tags: string[];
  /** Monotonically increasing version — bumped on every mutation. */
  version: number;
  active: boolean;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  /** Freeform per-scene extension bucket. */
  custom?: Record<string, unknown>;
  /** Ordered list of actions (order + priority steer execution). */
  actions: SceneAction[];
  /** Order within the library. */
  order: number;
  /** Optional parameter definitions (prepared, not yet evaluated). */
  parameters?: SceneParameter[];
  /** If instantiated from a template, keep the reference. */
  templateId?: ID;
  /** User binding (Teil 12). All optional. */
  ownerUserId?: ID;
  sharedUserIds?: ID[];
}
