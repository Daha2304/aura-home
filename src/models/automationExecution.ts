import type { ID, Timestamp } from "./common";

export type AutomationExecutionStatus =
  | "planned"
  | "running"
  | "partial"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "skipped-conditions";

export type AutomationStepState =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export interface AutomationExecutionStep {
  actionId: ID;
  kind: string;
  commandIds: ID[];
  state: AutomationStepState;
  error?: string;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
}

export interface AutomationExecutionProgress {
  total: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface AutomationRollbackEntry {
  deviceId: ID;
  capabilityId: string;
  previousValue: unknown;
}

export interface AutomationExecution {
  id: ID;
  automationId: ID;
  triggerId?: ID;
  status: AutomationExecutionStatus;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
  progress: AutomationExecutionProgress;
  steps: AutomationExecutionStep[];
  conditionsResult?: boolean;
  /** Vorbereitung Rollback — Executor befüllt nur, führt nichts aus. */
  rollbackSnapshot: AutomationRollbackEntry[];
  correlationId: string;
  /** Optionaler Trigger-Payload für Debug/Timeline. */
  triggerPayload?: unknown;
}
