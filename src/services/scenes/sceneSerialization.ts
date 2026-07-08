import type { Scene } from "@/models/scene";
import type { SceneTemplate } from "@/models/sceneTemplate";
import type { SceneVersion } from "@/models/sceneVersion";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useSceneVersionsStore } from "@/store/slices/sceneVersionsStore";
import { useSceneTemplatesStore } from "@/store/slices/sceneTemplatesStore";
import { sceneManager } from "./SceneManager";
import { sceneTemplateRegistry } from "./SceneTemplateRegistry";
import { sceneEvents } from "./SceneEvents";

export interface ScenesExport {
  schemaVersion: number;
  exportedAt: number;
  scenes: Scene[];
  templates: SceneTemplate[];
  versions: Record<string, SceneVersion[]>;
}

const CURRENT_SCHEMA = 1;

export function exportScenes(): ScenesExport {
  return {
    schemaVersion: CURRENT_SCHEMA,
    exportedAt: Date.now(),
    scenes: useScenesStore.getState().scenes,
    templates: useSceneTemplatesStore.getState().templates,
    versions: useSceneVersionsStore.getState().byScene,
  };
}

export function importScenes(json: string, mode: "merge" | "replace" = "merge"): number {
  const parsed = JSON.parse(json) as Partial<ScenesExport>;
  if (!parsed || typeof parsed !== "object") throw new Error("Ungültiges Szenen-Export-Format");
  if (parsed.schemaVersion !== CURRENT_SCHEMA) {
    throw new Error(`Unbekannte Schema-Version: ${parsed.schemaVersion}`);
  }
  const scenes = parsed.scenes ?? [];
  const templates = parsed.templates ?? [];
  const versions = parsed.versions ?? {};

  if (mode === "replace") {
    useScenesStore.getState().setScenes(scenes);
    useSceneTemplatesStore.getState().setTemplates(templates);
    // reset version history to imported one
    const vs = useSceneVersionsStore.getState();
    for (const sceneId of Object.keys(vs.byScene)) vs.clear(sceneId);
    for (const [sceneId, list] of Object.entries(versions)) {
      for (const v of list.slice().reverse()) vs.add(v);
    }
  } else {
    for (const s of scenes) sceneManager.update(s.id, s) ?? sceneManager.create(s);
    for (const t of templates) sceneTemplateRegistry.register(t);
    const vs = useSceneVersionsStore.getState();
    for (const [, list] of Object.entries(versions)) {
      for (const v of list.slice().reverse()) vs.add(v);
    }
  }
  sceneEvents.emit("scenesImported", { count: scenes.length });
  sceneEvents.emit("changed", undefined);
  return scenes.length;
}
