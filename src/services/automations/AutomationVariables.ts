import type { AutomationVariable, AutomationVariableType } from "@/models/automationVariable";
import { useAutomationVariablesStore } from "@/store/slices/automationVariablesStore";
import { createId } from "@/utils/ids";

/**
 * Kleines Read/Write-Facade über den Variablen-Store. Wird u. a. von der
 * built-in Action `variable.set` und den Conditions genutzt.
 */
class AutomationVariablesImpl {
  hydrate(): void {
    useAutomationVariablesStore.getState().hydrate();
  }
  get(key: string): AutomationVariable | undefined {
    return useAutomationVariablesStore.getState().byKey[key];
  }
  value(key: string): unknown {
    return this.get(key)?.value;
  }
  set(key: string, value: unknown, type: AutomationVariableType = "json", scope: "global" | "automation" = "global", automationId?: string): AutomationVariable {
    const existing = this.get(key);
    const v: AutomationVariable = existing
      ? { ...existing, value, updatedAt: Date.now() }
      : {
          id: createId("avar"),
          key,
          type,
          value,
          scope,
          automationId,
          updatedAt: Date.now(),
        };
    useAutomationVariablesStore.getState().set(v);
    return v;
  }
  remove(id: string): void {
    useAutomationVariablesStore.getState().remove(id);
  }
}

export const automationVariables = new AutomationVariablesImpl();
