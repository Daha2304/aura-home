import type { Scene, SceneAction, SceneCategory, SceneParameter } from "@/models/scene";
import type { IconName } from "@/models/common";
import { useScenesStore } from "@/store/slices/scenesStore";
import { readJson, writeJson } from "@/services/storage/localStorage";
import { createId } from "@/utils/ids";
import { createLogger } from "@/services/logger/Logger";
import { sceneEvents } from "./SceneEvents";
import { sceneVersionStore } from "./SceneVersionStore";

const log = createLogger("scenes");
const STORAGE_KEY = "scenes.v2";
const LEGACY_KEY = "scenes.v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto & { randomUUID: () => string }).randomUUID();
  }
  return createId("uuid");
}

export interface CreateSceneInput {
  name: string;
  description?: string;
  icon?: IconName;
  color?: string;
  category?: SceneCategory;
  favorite?: boolean;
  tags?: string[];
  actions?: SceneAction[];
  parameters?: SceneParameter[];
  templateId?: string;
  createdBy?: string;
  custom?: Record<string, unknown>;
}

/**
 * Migrate any pre-Teil-8 Scene shape into the full model. Old scenes
 * only carried `id, name, icon, color?, actions[], favorite?, order` with
 * SceneAction = { deviceId, capabilityId, value }.
 */
function migrateScene(raw: unknown, order: number): Scene | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Scene> & {
    value?: unknown;
    actions?: Array<Partial<SceneAction> & { value?: unknown }>;
  };
  if (!r.id || !r.name) return null;
  const now = Date.now();
  const actions: SceneAction[] = (r.actions ?? []).map((a, i) => ({
    id: a.id ?? createId("sa"),
    deviceId: a.deviceId,
    groupId: a.groupId,
    capabilityId: a.capabilityId ?? "",
    targetValue: a.targetValue !== undefined ? a.targetValue : a.value,
    previousValue: a.previousValue,
    delayMs: a.delayMs ?? 0,
    priority: a.priority ?? i,
    parallel: a.parallel ?? true,
    optional: a.optional ?? false,
    errorStrategy: a.errorStrategy ?? "continue",
    comment: a.comment,
    condition: a.condition,
    parameterRef: a.parameterRef,
  }));
  return {
    id: r.id,
    uuid: r.uuid ?? uuid(),
    name: r.name,
    description: r.description,
    icon: r.icon ?? "sparkles",
    color: r.color,
    category: r.category ?? "custom",
    favorite: r.favorite ?? false,
    tags: r.tags ?? [],
    version: r.version ?? 1,
    active: r.active ?? true,
    archived: r.archived ?? false,
    createdAt: r.createdAt ?? now,
    updatedAt: r.updatedAt ?? now,
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    custom: r.custom,
    actions,
    order: r.order ?? order,
    parameters: r.parameters,
    templateId: r.templateId,
  };
}

/**
 * Owns all scene mutations. Every write produces a version snapshot
 * (via SceneVersionStore) and emits scene events. Persists to
 * localStorage; no other module writes directly to the ScenesStore.
 */
export class SceneManager {
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    sceneVersionStore.hydrate();

    let raw = readJson<unknown[]>(STORAGE_KEY);
    if (!raw) {
      // Migrate from very old key if present.
      const legacy = readJson<unknown[]>(LEGACY_KEY);
      if (legacy) raw = legacy;
    }
    if (Array.isArray(raw)) {
      const scenes = raw
        .map((s, i) => migrateScene(s, i))
        .filter((s): s is Scene => !!s);
      useScenesStore.getState().setScenes(scenes);
      log.info("hydrated", scenes.length, "scenes");
    }
    useScenesStore.subscribe((s) => {
      writeJson(STORAGE_KEY, s.scenes);
    });
  }

  list(): Scene[] {
    return useScenesStore.getState().scenes;
  }

  get(id: string): Scene | undefined {
    return useScenesStore.getState().byId[id];
  }

  create(input: CreateSceneInput): Scene {
    const now = Date.now();
    const order = useScenesStore.getState().scenes.length;
    const scene: Scene = {
      id: createId("scene"),
      uuid: uuid(),
      name: input.name.trim() || "Neue Szene",
      description: input.description,
      icon: input.icon ?? "sparkles",
      color: input.color,
      category: input.category ?? "custom",
      favorite: input.favorite ?? false,
      tags: input.tags ?? [],
      version: 1,
      active: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      custom: input.custom,
      actions: input.actions ?? [],
      order,
      parameters: input.parameters,
      templateId: input.templateId,
    };
    useScenesStore.getState().upsertScene(scene);
    sceneVersionStore.snapshot(scene, input.createdBy);
    sceneEvents.emit("sceneCreated", { scene });
    sceneEvents.emit("changed", undefined);
    return scene;
  }

  update(id: string, patch: Partial<Scene>, updatedBy?: string): Scene | undefined {
    const previous = this.get(id);
    if (!previous) return undefined;
    const next: Scene = {
      ...previous,
      ...patch,
      id: previous.id,
      uuid: previous.uuid,
      version: previous.version + 1,
      updatedAt: Date.now(),
      updatedBy: updatedBy ?? previous.updatedBy,
    };
    useScenesStore.getState().upsertScene(next);
    sceneVersionStore.snapshot(next, updatedBy);
    sceneEvents.emit("sceneUpdated", { scene: next, previous });
    sceneEvents.emit("changed", undefined);
    return next;
  }

  patchActions(id: string, actions: SceneAction[], updatedBy?: string): Scene | undefined {
    return this.update(id, { actions }, updatedBy);
  }

  toggleFavorite(id: string): void {
    const s = this.get(id);
    if (!s) return;
    this.update(id, { favorite: !s.favorite });
  }

  archive(id: string, archived = true): void {
    this.update(id, { archived, active: !archived });
  }

  delete(id: string): boolean {
    const s = this.get(id);
    if (!s) return false;
    useScenesStore.getState().removeScene(id);
    sceneVersionStore.clear(id);
    sceneEvents.emit("sceneDeleted", { id });
    sceneEvents.emit("changed", undefined);
    return true;
  }

  duplicate(id: string): Scene | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    return this.create({
      name: `${src.name} (Kopie)`,
      description: src.description,
      icon: src.icon,
      color: src.color,
      category: src.category,
      favorite: false,
      tags: src.tags,
      actions: src.actions.map((a) => ({ ...a, id: createId("sa") })),
      parameters: src.parameters,
      templateId: src.templateId,
      custom: src.custom,
    });
  }

  restoreVersion(sceneId: string, versionNumber: number, updatedBy?: string): Scene | undefined {
    const versions = sceneVersionStore.list(sceneId);
    const v = versions.find((x) => x.versionNumber === versionNumber);
    if (!v) return undefined;
    return this.update(sceneId, v.payload, updatedBy);
  }
}

export const sceneManager = new SceneManager();
