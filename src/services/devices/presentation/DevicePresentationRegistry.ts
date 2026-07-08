import type { Device } from "@/models/device";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { createLogger } from "@/services/logger/Logger";
import type { DevicePresenter } from "./DevicePresentation";

const log = createLogger("device-presentation");

/**
 * Plugin-fähige Presenter-Registry. Auflösung in dieser Reihenfolge:
 *   1. Exakter Typ-Match
 *   2. Kategorie-Match
 *   3. Fallback (`generic`)
 *
 * Keine if/else-Ketten in UI-Code — alles läuft über `resolve()`.
 */
export class DevicePresentationRegistry {
  private readonly byType = new Map<string, DevicePresenter>();
  private readonly byCategory = new Map<string, DevicePresenter>();
  private fallback: DevicePresenter | null = null;

  register(p: DevicePresenter): void {
    if (p.match.type) {
      if (this.byType.has(p.match.type)) {
        log.debug("presenter overrides existing type", p.match.type);
      }
      this.byType.set(p.match.type, p);
    } else if (p.match.category) {
      this.byCategory.set(p.match.category, p);
    } else {
      this.fallback = p;
    }
  }

  registerFallback(p: DevicePresenter): void {
    this.fallback = p;
  }

  resolve(device: Device): DevicePresenter {
    const byType = this.byType.get(device.type);
    if (byType) return byType;
    const desc = deviceRegistry.get(device.type);
    if (desc) {
      const byCat = this.byCategory.get(desc.category);
      if (byCat) return byCat;
    }
    if (!this.fallback) {
      throw new Error("DevicePresentationRegistry: no fallback registered");
    }
    return this.fallback;
  }

  presenters(): DevicePresenter[] {
    return [
      ...this.byType.values(),
      ...this.byCategory.values(),
      ...(this.fallback ? [this.fallback] : []),
    ];
  }
}

export const devicePresentationRegistry = new DevicePresentationRegistry();
