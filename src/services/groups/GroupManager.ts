import type { DeviceGroup, DeviceGroupKind, DeviceGroupStatus } from "@/models/deviceGroup";
import type { IconName } from "@/models/common";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { readJson, writeJson } from "@/services/storage/localStorage";
import { createId } from "@/utils/ids";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createLogger } from "@/services/logger/Logger";
import { groupEvents } from "@/services/scenes/SceneEvents";
import { groupResolver } from "./GroupResolver";

const log = createLogger("groups");
const STORAGE_KEY = "groups.v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto & { randomUUID: () => string }).randomUUID();
  }
  return createId("uuid");
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  icon?: IconName;
  color?: string;
  kind?: DeviceGroupKind;
  category?: string;
  favorite?: boolean;
  tags?: string[];
  deviceIds?: string[];
  groupIds?: string[];
  capabilities?: string[];
  createdBy?: string;
  custom?: Record<string, unknown>;
}

export interface UpdateChildrenInput {
  deviceIds?: string[];
  groupIds?: string[];
  capabilities?: string[];
}

export type SetChildrenResult =
  | { ok: true; group: DeviceGroup }
  | { ok: false; reason: "not_found" | "cycle" };

function migrateGroup(raw: unknown, order: number): DeviceGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<DeviceGroup>;
  if (!r.id || !r.name) return null;
  const now = Date.now();
  return {
    id: r.id,
    uuid: r.uuid ?? uuid(),
    name: r.name,
    description: r.description,
    icon: r.icon ?? "layers",
    color: r.color,
    category: r.category,
    kind: r.kind ?? "mixed",
    favorite: r.favorite ?? false,
    tags: r.tags ?? [],
    version: r.version ?? 1,
    deviceIds: r.deviceIds ?? [],
    groupIds: r.groupIds ?? [],
    capabilities: r.capabilities ?? [],
    status: r.status ?? "unknown",
    custom: r.custom,
    createdAt: r.createdAt ?? now,
    updatedAt: r.updatedAt ?? now,
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    order: r.order ?? order,
  };
}

export class GroupManager {
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const raw = readJson<unknown[]>(STORAGE_KEY);
    if (Array.isArray(raw)) {
      const groups = raw
        .map((g, i) => migrateGroup(g, i))
        .filter((g): g is DeviceGroup => !!g);
      useGroupsStore.getState().setGroups(groups);
      log.info("hydrated", groups.length, "groups");
    }
    useGroupsStore.subscribe((s) => {
      writeJson(STORAGE_KEY, s.groups);
    });
  }

  list(): DeviceGroup[] {
    return useGroupsStore.getState().groups;
  }

  get(id: string): DeviceGroup | undefined {
    return useGroupsStore.getState().byId[id];
  }

  create(input: CreateGroupInput): DeviceGroup {
    const now = Date.now();
    const order = useGroupsStore.getState().groups.length;
    const group: DeviceGroup = {
      id: createId("grp"),
      uuid: uuid(),
      name: input.name.trim() || "Neue Gruppe",
      description: input.description,
      icon: input.icon ?? "layers",
      color: input.color,
      category: input.category,
      kind: input.kind ?? "mixed",
      favorite: input.favorite ?? false,
      tags: input.tags ?? [],
      version: 1,
      deviceIds: input.deviceIds ?? [],
      groupIds: input.groupIds ?? [],
      capabilities: input.capabilities ?? [],
      status: "unknown" satisfies DeviceGroupStatus,
      custom: input.custom,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      order,
    };
    useGroupsStore.getState().upsertGroup(group);
    groupEvents.emit("groupCreated", { group });
    groupEvents.emit("changed", undefined);
    return group;
  }

  update(id: string, patch: Partial<DeviceGroup>, updatedBy?: string): DeviceGroup | undefined {
    const previous = this.get(id);
    if (!previous) return undefined;
    // Cycle guard when groupIds patched.
    if (patch.groupIds) {
      if (groupResolver.wouldCycle(id, patch.groupIds)) {
        errorBus.report(
          new AppError("invalid_message", "Gerätegruppe würde einen Zyklus erzeugen", {
            code: "group_cycle",
            context: { id, groupIds: patch.groupIds },
          }),
        );
        return previous;
      }
    }
    const next: DeviceGroup = {
      ...previous,
      ...patch,
      id: previous.id,
      uuid: previous.uuid,
      version: previous.version + 1,
      updatedAt: Date.now(),
      updatedBy: updatedBy ?? previous.updatedBy,
    };
    useGroupsStore.getState().upsertGroup(next);
    groupEvents.emit("groupUpdated", { group: next, previous });
    groupEvents.emit("changed", undefined);
    return next;
  }

  setChildren(id: string, input: UpdateChildrenInput, updatedBy?: string): SetChildrenResult {
    const previous = this.get(id);
    if (!previous) return { ok: false, reason: "not_found" };
    const groupIds = input.groupIds ?? previous.groupIds;
    if (groupResolver.wouldCycle(id, groupIds)) {
      errorBus.report(
        new AppError("invalid_message", "Gerätegruppe würde einen Zyklus erzeugen", {
          code: "group_cycle",
          context: { id, groupIds },
        }),
      );
      return { ok: false, reason: "cycle" };
    }
    const patch: Partial<DeviceGroup> = {
      deviceIds: input.deviceIds ?? previous.deviceIds,
      groupIds,
      capabilities: input.capabilities ?? previous.capabilities,
    };
    const updated = this.update(id, patch, updatedBy);
    return updated ? { ok: true, group: updated } : { ok: false, reason: "not_found" };
  }

  toggleFavorite(id: string): void {
    const g = this.get(id);
    if (!g) return;
    this.update(id, { favorite: !g.favorite });
  }

  delete(id: string): boolean {
    const g = this.get(id);
    if (!g) return false;
    useGroupsStore.getState().removeGroup(id);
    // Detach from any parent group referencing this id.
    for (const parent of this.list()) {
      if (parent.groupIds.includes(id)) {
        this.update(parent.id, { groupIds: parent.groupIds.filter((x) => x !== id) });
      }
    }
    groupEvents.emit("groupDeleted", { id });
    groupEvents.emit("changed", undefined);
    return true;
  }

  duplicate(id: string): DeviceGroup | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    return this.create({
      name: `${src.name} (Kopie)`,
      description: src.description,
      icon: src.icon,
      color: src.color,
      kind: src.kind,
      category: src.category,
      tags: src.tags,
      deviceIds: src.deviceIds,
      groupIds: src.groupIds,
      capabilities: src.capabilities,
      custom: src.custom,
    });
  }
}

export const groupManager = new GroupManager();
