import type { ID } from "./common";
import type { Automation } from "./automation";
import type { AutomationExecution } from "./automationExecution";

export interface AutomationEvents {
  automationCreated: { automation: Automation };
  automationUpdated: { automation: Automation; previous: Automation };
  automationDeleted: { id: ID };
  automationEnabled: { id: ID };
  automationDisabled: { id: ID };
  automationTriggered: { id: ID; triggerId: ID; payload?: unknown };
  automationStarted: { execution: AutomationExecution };
  automationProgress: { execution: AutomationExecution };
  automationCompleted: { execution: AutomationExecution };
  automationFailed: { execution: AutomationExecution; reason: string };
  automationCancelled: { execution: AutomationExecution };
  automationsImported: { count: number };
  changed: void;
}
