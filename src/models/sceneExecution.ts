import type { ID, Timestamp } from "./common";

export type SceneExecutionStatus =
  | "planned"
  | "running"
  | "partial"
  | "succeeded"
  | "failed"
  | "cancelled";

export type SceneStepState =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export interface SceneExecutionStep {
  actionId: ID;
  deviceId: ID;
  capabilityId: string;
  targetValue: unknown;
  previousValue?: unknown;
  /** Correlated Command ids (fan-out for groups). */
  commandIds: ID[];
  state: SceneStepState;
  error?: string;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
}

export interface SceneExecutionProgress {
  total: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface SceneUndoEntry {
  deviceId: ID;
  capabilityId: string;
  previousValue: unknown;
}

/**
 * Live and historical scene execution record. `undoSnapshot` is captured
 * up-front so an Undo action can later revert the world back — Teil 8
 * only prepares the data, no actual undo runs yet.
 */
export interface SceneExecution {
  id: ID;
  sceneId: ID;
  status: SceneExecutionStatus;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
  progress: SceneExecutionProgress;
  steps: SceneExecutionStep[];
  undoable: boolean;
  undoSnapshot: SceneUndoEntry[];
  /** Optional caller-provided arguments (parameter values). */
  args?: Record<string, unknown>;
}
