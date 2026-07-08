import type { Device } from "@/models/device";

export interface DiscoveryListener {
  onFound(device: Device): void;
  onLost(deviceId: string): void;
}

export interface IDiscoveryService {
  start(listener: DiscoveryListener): void;
  stop(): void;
  refresh(): Promise<void>;
  assignRoom(deviceId: string, roomId: string): Promise<void>;
  remove(deviceId: string): Promise<void>;
}
