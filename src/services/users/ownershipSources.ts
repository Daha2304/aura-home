/**
 * Registers ownership sources for the built-in refTypes. Each source
 * reads Ownership out of the domain store directly — no duplicated data.
 */
import { ownershipRegistry } from "./OwnershipRegistry";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { useAutomationsStore } from "@/store/slices/automationsStore";

let registered = false;

export function registerBuiltinOwnershipSources(): void {
  if (registered) return;
  registered = true;

  ownershipRegistry.registerOwnershipSource({
    refType: "device",
    read(id) {
      const d = useDevicesStore.getState().devices.find((x) => x.id === id);
      if (!d) return undefined;
      return {
        refType: "device",
        refId: id,
        ownerUserId: d.ownerUserId,
        memberUserIds: d.controlUserIds,
        guestUserIds: d.visibleToUserIds,
      };
    },
  });

  ownershipRegistry.registerOwnershipSource({
    refType: "room",
    read(id) {
      const r = useRoomsStore.getState().rooms.find((x) => x.id === id);
      if (!r) return undefined;
      return {
        refType: "room",
        refId: id,
        ownerUserId: r.ownerUserId,
        memberUserIds: r.memberUserIds,
        guestUserIds: r.guestUserIds,
      };
    },
  });

  ownershipRegistry.registerOwnershipSource({
    refType: "scene",
    read(id) {
      const s = useScenesStore.getState().scenes.find((x) => x.id === id);
      if (!s) return undefined;
      return {
        refType: "scene",
        refId: id,
        ownerUserId: s.ownerUserId,
        memberUserIds: s.sharedUserIds,
      };
    },
  });

  ownershipRegistry.registerOwnershipSource({
    refType: "group",
    read(id) {
      const g = useGroupsStore.getState().groups.find((x) => x.id === id);
      if (!g) return undefined;
      return {
        refType: "group",
        refId: id,
        ownerUserId: g.ownerUserId,
        memberUserIds: g.sharedUserIds,
      };
    },
  });

  ownershipRegistry.registerOwnershipSource({
    refType: "automation",
    read(id) {
      const a = useAutomationsStore
        .getState()
        .automations.find((x) => x.id === id);
      if (!a) return undefined;
      return {
        refType: "automation",
        refId: id,
        ownerUserId: a.ownerUserId,
        memberUserIds: a.sharedUserIds,
        editorUserIds: a.editorUserIds,
      };
    },
  });
}
