import type { IDiscoveryService, DiscoveryListener } from "./types";

export class DiscoveryService implements IDiscoveryService {
  start(_listener: DiscoveryListener): void {
    // wired with the real WS client
  }
  stop(): void {}
  async refresh(): Promise<void> {}
  async assignRoom(_deviceId: string, _roomId: string): Promise<void> {}
  async remove(_deviceId: string): Promise<void> {}
}
