import type { DeviceGroup, DeviceGroupKind } from "@/models/deviceGroup";
import { useGroupsStore } from "@/store/slices/groupsStore";

/**
 * Read-only facade over GroupsStore. GroupManager owns writes.
 */
class GroupRegistryImpl {
  get(id: string): DeviceGroup | undefined {
    return useGroupsStore.getState().byId[id];
  }
  all(): DeviceGroup[] {
    return useGroupsStore.getState().groups;
  }
  byKind(k: DeviceGroupKind): DeviceGroup[] {
    const s = useGroupsStore.getState();
    return (s.byKind[k] ?? []).map((id) => s.byId[id]).filter(Boolean) as DeviceGroup[];
  }
  byDevice(deviceId: string): DeviceGroup[] {
    return this.all().filter((g) => g.deviceIds.includes(deviceId));
  }
  byParent(parentId: string): DeviceGroup[] {
    return this.all().filter((g) => g.groupIds.includes(parentId));
  }
  favorites(): DeviceGroup[] {
    return this.all().filter((g) => g.favorite);
  }
}

export const groupRegistry = new GroupRegistryImpl();
