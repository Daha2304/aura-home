import type { Automation } from "@/models/automation";
import type { AutomationTemplate } from "@/models/automationTemplate";
import { createId } from "@/utils/ids";
import { automationTemplateRegistry } from "./AutomationTemplateRegistry";
import { automationManager } from "./AutomationManager";

class AutomationTemplateManagerImpl {
  register(t: AutomationTemplate): void {
    automationTemplateRegistry.register(t);
  }

  /**
   * Instanziiert ein Template zu einer regulären Automation. Parameter
   * werden derzeit nur mitgeführt (custom.parameters), nicht evaluiert.
   */
  instantiate(templateId: string, params: Record<string, unknown> = {}, createdBy?: string): Automation | undefined {
    const t = automationTemplateRegistry.get(templateId);
    if (!t) return undefined;
    return automationManager.create({
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      category: t.category,
      tags: t.tags,
      triggers: t.triggers.map((tr) => ({ ...tr, id: createId("atr") })),
      conditions: t.conditions,
      actions: t.actions.map((a) => ({ ...a, id: createId("aac") })),
      templateId,
      createdBy,
      custom: { parameters: params },
    });
  }
}

export const automationTemplateManager = new AutomationTemplateManagerImpl();
