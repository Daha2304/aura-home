import type { Device } from "@/models/device";
import type {
  DevicePanelDescriptor,
  DevicePanelGroup,
} from "@/models/devicePanel";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("devicePanels");

class DevicePanelRegistryImpl {
  private readonly byId = new Map<string, DevicePanelDescriptor>();

  register(descriptor: DevicePanelDescriptor): void {
    this.byId.set(descriptor.id, descriptor);
    log.debug("registered device panel", descriptor.id);
  }

  get(id: string): DevicePanelDescriptor | undefined {
    return this.byId.get(id);
  }

  all(): DevicePanelDescriptor[] {
    return Array.from(this.byId.values()).sort(
      (a, b) => b.priority - a.priority,
    );
  }

  visibleFor(device: Device): DevicePanelDescriptor[] {
    return this.all().filter((p) => {
      try {
        return p.isVisible(device);
      } catch {
        return false;
      }
    });
  }

  byGroup(group: DevicePanelGroup): DevicePanelDescriptor[] {
    return this.all().filter((p) => p.group === group);
  }

  clear(): void {
    this.byId.clear();
  }
}

export const devicePanelRegistry = new DevicePanelRegistryImpl();
