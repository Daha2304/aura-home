import type { ID, Timestamp } from "./common";

export type CommandState =
  | "queued"
  | "sending"
  | "sent"
  | "acknowledged"
  | "completed"
  | "failed"
  | "cancelled"
  | "retrying";

export interface CommandError {
  code?: string;
  message: string;
  cause?: unknown;
}

export interface Command {
  id: ID;
  deviceId: ID;
  key: string;
  value: unknown;
  previousValue?: unknown;
  state: CommandState;
  attempts: number;
  maxAttempts: number;
  timeoutMs: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  correlationId?: string;
  error?: CommandError;
  optimistic?: boolean;
}

export interface CommandResult {
  ok: boolean;
  value?: unknown;
  error?: CommandError;
}
