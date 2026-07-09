import type { ID, Timestamp } from "./common";

export type AutomationVariableType = "boolean" | "number" | "string" | "json";
export type AutomationVariableScope = "global" | "automation";

export interface AutomationVariable {
  id: ID;
  key: string;
  type: AutomationVariableType;
  value: unknown;
  scope: AutomationVariableScope;
  /** Nur bei Scope „automation" gesetzt. */
  automationId?: ID;
  updatedAt: Timestamp;
}
