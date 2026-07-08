import type { SceneTemplate } from "@/models/sceneTemplate";
import type { SceneCategory } from "@/models/scene";
import { useSceneTemplatesStore } from "@/store/slices/sceneTemplatesStore";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("scene-templates");

/**
 * Plugin registry for scene templates. Templates are their own data
 * entity — they never mix with scenes. Built-ins register at bootstrap;
 * additional templates may be added via import (see sceneSerialization).
 */
class SceneTemplateRegistryImpl {
  register(template: SceneTemplate): void {
    const store = useSceneTemplatesStore.getState();
    const existing = store.byId[template.id];
    if (existing && existing.version >= template.version) return;
    store.upsert(template);
    log.debug("registered template", template.id, "v" + template.version);
  }

  unregister(id: string): void {
    useSceneTemplatesStore.getState().remove(id);
  }

  get(id: string): SceneTemplate | undefined {
    return useSceneTemplatesStore.getState().byId[id];
  }

  all(): SceneTemplate[] {
    return useSceneTemplatesStore.getState().templates;
  }

  listByCategory(category: SceneCategory): SceneTemplate[] {
    return this.all().filter((t) => t.category === category);
  }
}

export const sceneTemplateRegistry = new SceneTemplateRegistryImpl();
