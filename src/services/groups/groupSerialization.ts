import type { DeviceGroup } from "@/models/deviceGroup";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { groupManager } from "./GroupManager";
import { groupEvents } from "@/services/scenes/SceneEvents";

export interface GroupsExport {
  schemaVersion: number;
  exportedAt: number;
  groups: DeviceGroup[];
}

const CURRENT_SCHEMA = 1;

export function exportGroups(): GroupsExport {
  return {
    schemaVersion: CURRENT_SCHEMA,
    exportedAt: Date.now(),
    groups: useGroupsStore.getState().groups,
  };
}

export function importGroups(json: string, mode: "merge" | "replace" = "merge"): number {
  const parsed = JSON.parse(json) as Partial<GroupsExport>;
  if (!parsed || typeof parsed !== "object") throw new Error("Ungültiges Gruppen-Export-Format");
  if (parsed.schemaVersion !== CURRENT_SCHEMA) {
    throw new Error(`Unbekannte Schema-Version: ${parsed.schemaVersion}`);
  }
  const groups = parsed.groups ?? [];
  if (mode === "replace") {
    useGroupsStore.getState().setGroups(groups);
  } else {
    for (const g of groups) groupManager.update(g.id, g) ?? groupManager.create(g);
  }
  groupEvents.emit("groupsImported", { count: groups.length });
  groupEvents.emit("changed", undefined);
  return groups.length;
}
