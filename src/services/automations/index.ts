export {
  triggerRegistry,
  conditionRegistry,
  actionRegistry,
  type TriggerDescriptor,
  type ConditionDescriptor,
  type ActionDescriptor,
  type ActionPlan,
  type PlannedCommand,
  type Unsubscribe,
  type TriggerContext,
  type ConditionEvalContext,
  type ActionPlanContext,
} from "./descriptors";

export { automationEvents } from "./AutomationEvents";
export { automationManager } from "./AutomationManager";
export { automationRegistry } from "./AutomationRegistry";
export { automationExecutor } from "./AutomationExecutor";
export { automationScheduler } from "./AutomationScheduler";
export { automationVersionStore } from "./AutomationVersionStore";
export { automationTemplateRegistry } from "./AutomationTemplateRegistry";
export { automationTemplateManager } from "./AutomationTemplateManager";
export { automationHistory } from "./AutomationHistory";
export { automationVariables } from "./AutomationVariables";
export { validateAutomation } from "./AutomationValidator";
export type { ValidationResult, ValidationIssue } from "./AutomationValidator";
export { exportAutomations, importAutomations } from "./automationSerialization";
export type { AutomationBundle, ImportStrategy, ImportResult } from "./automationSerialization";
export { registerBuiltinAutomationDescriptors } from "./builtin";

import { automationManager } from "./AutomationManager";
import { automationExecutor } from "./AutomationExecutor";
import { automationScheduler } from "./AutomationScheduler";
import { automationHistory } from "./AutomationHistory";
import { automationVariables } from "./AutomationVariables";
import { registerBuiltinAutomationDescriptors } from "./builtin";

let bootstrapped = false;

export function bootstrapAutomations(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  automationVariables.hydrate();
  registerBuiltinAutomationDescriptors();
  automationManager.hydrate();
  automationExecutor.start();
  automationScheduler.start();
  automationHistory.start();
}

export function stopAutomations(): void {
  if (!bootstrapped) return;
  automationScheduler.stop();
  automationExecutor.stop();
  automationHistory.stop();
  bootstrapped = false;
}
