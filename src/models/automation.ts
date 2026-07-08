import type { ID } from "./common";

export type TriggerKind =
  | "time"
  | "sunrise"
  | "sunset"
  | "device-state"
  | "sensor-threshold"
  | "presence"
  | "webhook";

export interface AutomationTrigger {
  id: string;
  kind: TriggerKind;
  config: Record<string, unknown>;
}

export interface AutomationCondition {
  id: string;
  kind: string;
  config: Record<string, unknown>;
}

export interface AutomationAction {
  id: string;
  kind: "device" | "scene" | "notification" | "delay";
  config: Record<string, unknown>;
}

export interface Automation {
  id: ID;
  name: string;
  enabled: boolean;
  triggers: AutomationTrigger[];
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  order: number;
}
