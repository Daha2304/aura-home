import type { ID } from "@/models/common";
import type { Device } from "@/models/device";
import type { RoomHealthStatus, HouseHealthStatus } from "@/models/roomHealth";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useRoomMetricsStore } from "@/store/slices/roomMetricsStore";
import { useHouseMetricsStore } from "@/store/slices/houseMetricsStore";
import { useInsightsStore } from "@/store/slices/insightsStore";
import { createLogger } from "@/services/logger/Logger";
import { intelligenceEvents } from "./events/IntelligenceEvents";
import { roomAggregator } from "./aggregation/RoomAggregator";
import { houseAggregator } from "./aggregation/HouseAggregator";
import { roomStatusEngine } from "./status/RoomStatusEngine";
import { houseStatusEngine } from "./status/HouseStatusEngine";
import { roomInsightsEngine } from "./insights/RoomInsightsEngine";
import { houseInsightsEngine } from "./insights/HouseInsightsEngine";
import { registerBuiltinContributors } from "./aggregation/contributors";

const UNASSIGNED = "__unassigned__";
const log = createLogger("intelligence");

/**
 * Orchestriert Aggregation, Status, Insights und Events.
 * Nur betroffene Räume werden neu berechnet.
 */
export class IntelligenceController {
  private started = false;
  private readonly unsubs: Array<() => void> = [];
  private readonly roomStatus = new Map<ID, RoomHealthStatus>();
  private houseStatus: HouseHealthStatus = "empty";
  private lastDeviceRevision = -1;
  private lastRooms: ID[] = [];
  private lastDeviceRoomIndex = new Map<ID, ID | undefined>();

  start(): void {
    if (this.started) return;
    this.started = true;
    registerBuiltinContributors();

    // Voll-Init
    this.recomputeAll();

    this.unsubs.push(
      useDevicesStore.subscribe((state, prev) => {
        if (state.revision === prev.revision) return;
        this.onDevicesChanged();
      }),
      useRoomsStore.subscribe((state, prev) => {
        if (state.rooms === prev.rooms) return;
        this.onRoomsChanged();
      }),
    );

    log.info("intelligence controller started");
  }

  stop(): void {
    if (!this.started) return;
    for (const off of this.unsubs) off();
    this.unsubs.length = 0;
    this.started = false;
  }

  // --- Public API ---

  recomputeAll(): void {
    const rooms = useRoomsStore.getState().rooms.map((r) => r.id);
    this.lastRooms = rooms;
    for (const id of rooms) this.recomputeRoom(id);
    this.recomputeRoom(UNASSIGNED);
    this.rebuildDeviceRoomIndex();
    this.recomputeHouse();
  }

  recomputeRoom(roomId: ID): void {
    const devices = this.devicesInRoom(roomId);
    const prev = useRoomMetricsStore.getState().get(roomId);
    const metrics = roomAggregator.compute(roomId, devices, prev?.revision ?? 0);
    useRoomMetricsStore.getState().setRoom(roomId, metrics);
    intelligenceEvents.emit("roomMetricsUpdated", { roomId, metrics });

    // Status
    const status = roomStatusEngine.derive(metrics);
    const previous = this.roomStatus.get(roomId);
    if (previous !== status) {
      this.roomStatus.set(roomId, status);
      intelligenceEvents.emit("roomStatusChanged", { roomId, status, previous });
    }

    // Insights
    const insights = roomInsightsEngine.build(metrics);
    useInsightsStore.getState().setRoom(roomId, insights);
    intelligenceEvents.emit("insightUpdated", { scope: "room", roomId, insights });
  }

  recomputeHouse(): void {
    const all = Array.from(useRoomMetricsStore.getState().byId.values());
    const prev = useHouseMetricsStore.getState();
    const metrics = houseAggregator.compute(all, prev.revision);
    useHouseMetricsStore.getState().set(metrics);
    intelligenceEvents.emit("houseMetricsUpdated", { metrics });

    const status = houseStatusEngine.derive(metrics);
    const previousStatus = this.houseStatus;
    if (previousStatus !== status) {
      this.houseStatus = status;
      intelligenceEvents.emit("houseStatusChanged", { status, previous: previousStatus });
    }

    const insights = houseInsightsEngine.build(metrics);
    useInsightsStore.getState().setHouse(insights);
    intelligenceEvents.emit("insightUpdated", { scope: "house", insights });
  }

  // --- Change detection ---

  private onDevicesChanged(): void {
    const devices = useDevicesStore.getState().devices;
    const nextIndex = new Map<ID, ID | undefined>();
    const dirty = new Set<ID>();

    for (const d of devices) {
      nextIndex.set(d.id, d.roomId);
      const prevRoom = this.lastDeviceRoomIndex.get(d.id);
      const nextRoom = d.roomId ?? UNASSIGNED;
      dirty.add(nextRoom);
      if (prevRoom !== d.roomId) {
        if (prevRoom) dirty.add(prevRoom);
        else if (this.lastDeviceRoomIndex.has(d.id)) dirty.add(UNASSIGNED);
      }
    }
    // Entfernte Geräte
    for (const [id, roomId] of this.lastDeviceRoomIndex) {
      if (!nextIndex.has(id)) dirty.add(roomId ?? UNASSIGNED);
    }

    this.lastDeviceRoomIndex = nextIndex;
    this.lastDeviceRevision = useDevicesStore.getState().revision;

    for (const roomId of dirty) this.recomputeRoom(roomId);
    if (dirty.size > 0) {
      intelligenceEvents.emit("aggregationUpdated", { roomIds: Array.from(dirty) });
      this.recomputeHouse();
    }
  }

  private onRoomsChanged(): void {
    const rooms = useRoomsStore.getState().rooms.map((r) => r.id);
    const known = new Set(this.lastRooms);
    const next = new Set(rooms);
    const removed: ID[] = [];
    for (const id of known) if (!next.has(id)) removed.push(id);
    const added: ID[] = [];
    for (const id of rooms) if (!known.has(id)) added.push(id);
    for (const id of removed) useRoomMetricsStore.getState().removeRoom(id);
    for (const id of added) this.recomputeRoom(id);
    this.lastRooms = rooms;
    if (added.length || removed.length) this.recomputeHouse();
  }

  private rebuildDeviceRoomIndex(): void {
    const idx = new Map<ID, ID | undefined>();
    for (const d of useDevicesStore.getState().devices) idx.set(d.id, d.roomId);
    this.lastDeviceRoomIndex = idx;
    this.lastDeviceRevision = useDevicesStore.getState().revision;
  }

  private devicesInRoom(roomId: ID): Device[] {
    const devices = useDevicesStore.getState().devices;
    if (roomId === UNASSIGNED) return devices.filter((d) => !d.roomId);
    return devices.filter((d) => d.roomId === roomId);
  }
}

export const intelligenceController = new IntelligenceController();
export const UNASSIGNED_ROOM_ID = UNASSIGNED;
