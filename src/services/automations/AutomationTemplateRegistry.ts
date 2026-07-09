import type { AutomationTemplate } from "@/models/automationTemplate";
import { useAutomationTemplatesStore } from "@/store/slices/automationTemplatesStore";

class AutomationTemplateRegistryImpl {
  register(t: AutomationTemplate): void {
    useAutomationTemplatesStore.getState().register(t);
  }
  unregister(id: string): void {
    useAutomationTemplatesStore.getState().remove(id);
  }
  get(id: string): AutomationTemplate | undefined {
    return useAutomationTemplatesStore.getState().byId[id];
  }
  list(): AutomationTemplate[] {
    return useAutomationTemplatesStore.getState().templates;
  }
}

export const automationTemplateRegistry = new AutomationTemplateRegistryImpl();
