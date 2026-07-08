import type { ID } from "@/models/common";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { intelligenceEvents } from "../events/IntelligenceEvents";

export interface AssignmentInput {
  roomId?: ID | null;
  groupIds?: ID[];
  floor?: number | null;
  virtualRoomId?: ID | null;
}

/**
 * Zentrale Zuordnungs-Engine. Mutiert ausschließlich den DevicesStore und
 * emittet Intelligence-Events. Der IntelligenceController hört auf diese
 * Events und triggert die Neuberechnung.
 */
export class DeviceAssignmentEngine {
  assign(deviceId: ID, input: AssignmentInput): void {
    const store = useDevicesStore.getState();
    const device = store.byId(deviceId);
    if (!device) return;

    const previousRoomId = device.roomId;
    const nextRoomId = input.roomId === null ? undefined : input.roomId ?? previousRoomId;
    const nextFloor = input.floor === null ? undefined : input.floor ?? device.floor;
    const nextGroupIds = input.groupIds ?? device.groupIds;

    const customProperties =
      input.virtualRoomId !== undefined
        ? {
            ...(device.customProperties ?? {}),
            virtualRoomId: input.virtualRoomId ?? undefined,
          }
        : device.customProperties;

    store.upsertDevice({
      ...device,
      roomId: nextRoomId,
      floor: nextFloor,
      groupIds: nextGroupIds,
      customProperties,
      updatedAt: Date.now(),
    });

    if (nextRoomId !== previousRoomId) {
      if (!nextRoomId) {
        intelligenceEvents.emit("deviceUnassigned", { deviceId, previousRoomId });
      } else {
        intelligenceEvents.emit("deviceAssigned", {
          deviceId,
          roomId: nextRoomId,
          previousRoomId,
        });
      }
    }
  }

  unassign(deviceId: ID): void {
    this.assign(deviceId, { roomId: null });
  }
}

export const deviceAssignmentEngine = new DeviceAssignmentEngine();
