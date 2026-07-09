import type { ID, Timestamp, IconName } from "./common";

/**
 * Extended Automation model (Teil 9). Legacy pre-Teil-9 shape kept
 * lesbar via optional fields + migration in AutomationManager. The
 * condition tree is a boolean-algebra of ConditionNodes; older flat
 * `conditions[]` arrays are migrated into an implicit `and`-Wurzel.
 */

export type AutomationCategory =
  | "presence"
  | "time"
  | "climate"
  | "light"
  | "security"
  | "media"
  | "energy"
  | "notification"
  | "custom";

export type AutomationErrorStrategy = "abort" | "continue" | "retry";

/** Registry-id, offener String. */
export type TriggerKind = string;
/** Registry-id, offener String. */
export type ConditionKind = string;
/** Registry-id, offener String. */
export type ActionKind = string;

export interface AutomationTrigger {
  id: ID;
  kind: TriggerKind;
  config: Record<string, unknown>;
}

/**
 * Rekursiver Boolescher Bedingungsbaum. `and` / `or` / `not` sind
 * Container, alles andere ist ein Blatt aus der ConditionRegistry.
 */
export type ConditionNode =
  | { id: ID; kind: "and"; children: ConditionNode[] }
  | { id: ID; kind: "or"; children: ConditionNode[] }
  | { id: ID; kind: "not"; child: ConditionNode }
  | { id: ID; kind: string; config: Record<string, unknown> };

export interface AutomationAction {
  id: ID;
  kind: ActionKind;
  config: Record<string, unknown>;
  /** Verzögerung vor dieser Aktion in ms. */
  delayMs?: number;
  /** Wenn true, läuft parallel zu Nachbarn mit gleicher Verzögerung. */
  parallel?: boolean;
  /** Optionale Aktion: darf scheitern ohne die Automation zu killen. */
  optional?: boolean;
  errorStrategy?: AutomationErrorStrategy;
  retry?: { count: number; backoffMs: number };
  /** Hinweis für spätere Rollback-Ausführung (Teil 10). */
  rollbackHint?: Record<string, unknown>;
}

export interface Automation {
  id: ID;
  uuid: string;
  name: string;
  description?: string;
  icon?: IconName;
  color?: string;
  category?: AutomationCategory;
  tags: string[];
  favorite: boolean;
  /** Bleibt = „aktiv" (bestehende Semantik). */
  enabled: boolean;
  priority: number;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  custom?: Record<string, unknown>;

  triggers: AutomationTrigger[];
  /** Wurzel-ConditionNode. `undefined` = keine Bedingung. */
  conditions?: ConditionNode;
  actions: AutomationAction[];

  errorStrategy: AutomationErrorStrategy;
  templateId?: ID;
  archived: boolean;
  /** Behalten für Bibliotheks-Ordnung. */
  order: number;
  /** User binding (Teil 12). All optional. */
  ownerUserId?: ID;
  sharedUserIds?: ID[];
  editorUserIds?: ID[];
}
