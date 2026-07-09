import type { ID, Timestamp } from "./common";
import type { Severity } from "./severity";

/**
 * Trace-Eintrag des Automation-Debuggers (Teil 10).
 * Wird über den automationTimelineSource in die Timeline gespiegelt.
 */
export interface AutomationDebugTrace {
  id: ID;
  automationId: ID;
  executionId?: ID;
  phase: "trigger" | "condition" | "action" | "pipeline" | "error";
  step?: string;
  detail?: string;
  durationMs?: number;
  severity?: Severity;
  timestamp: Timestamp;
  payload?: unknown;
}

/**
 * Ergebnis eines Trockenlaufs (Simulation). Keine Kommandos werden
 * ausgeführt, die CommandQueue wird nicht berührt.
 */
export interface AutomationSimulationResult {
  automationId: ID;
  startedAt: Timestamp;
  finishedAt: Timestamp;
  triggered: boolean;
  conditionsPassed: boolean;
  traces: AutomationDebugTrace[];
  plannedCommands: unknown[];
  errors: string[];
}
