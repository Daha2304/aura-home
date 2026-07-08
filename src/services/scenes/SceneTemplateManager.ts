import type { Scene, SceneAction } from "@/models/scene";
import type { SceneTemplate } from "@/models/sceneTemplate";
import { createId } from "@/utils/ids";
import { sceneManager } from "./SceneManager";
import { sceneTemplateRegistry } from "./SceneTemplateRegistry";

/**
 * Instantiates a SceneTemplate into a concrete Scene via SceneManager.
 * `parameterRef`-bound action fields are resolved from the caller-provided
 * `args` at instantiation time; unresolved refs are kept as-is.
 */
function resolveActionParameters(
  actions: SceneAction[],
  args: Record<string, unknown>,
): SceneAction[] {
  return actions.map((a) => {
    if (!a.parameterRef) return { ...a, id: createId("sa") };
    const bound = args[a.parameterRef];
    return {
      ...a,
      id: createId("sa"),
      targetValue: bound !== undefined ? bound : a.targetValue,
    };
  });
}

export class SceneTemplateManager {
  register(template: SceneTemplate): void {
    sceneTemplateRegistry.register(template);
  }

  instantiate(templateId: string, args: Record<string, unknown> = {}): Scene | undefined {
    const t = sceneTemplateRegistry.get(templateId);
    if (!t) return undefined;
    return sceneManager.create({
      name: t.name,
      description: t.description,
      icon: t.icon,
      color: t.color,
      category: t.category,
      tags: t.tags,
      parameters: t.parameters,
      templateId: t.id,
      actions: resolveActionParameters(t.actions, args),
    });
  }
}

export const sceneTemplateManager = new SceneTemplateManager();
