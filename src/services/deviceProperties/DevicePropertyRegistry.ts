import type { Device } from "@/models/device";
import type {
  DevicePropertyDescriptor,
  DevicePropertyGroup,
} from "@/models/deviceProperty";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("deviceProperties");

class DevicePropertyRegistryImpl {
  private readonly byId = new Map<string, DevicePropertyDescriptor>();

  register(descriptor: DevicePropertyDescriptor): void {
    this.byId.set(descriptor.id, descriptor);
    log.debug("registered device property", descriptor.id);
  }

  get(id: string): DevicePropertyDescriptor | undefined {
    return this.byId.get(id);
  }

  all(): DevicePropertyDescriptor[] {
    return Array.from(this.byId.values()).sort(
      (a, b) => b.priority - a.priority,
    );
  }

  byGroup(group: DevicePropertyGroup): DevicePropertyDescriptor[] {
    return this.all().filter((d) => d.group === group);
  }

  /**
   * Read all descriptors in a group for a device, dropping empty values
   * unless keepEmpty is set. Returns evaluated rows ready to render.
   */
  readGroup(
    group: DevicePropertyGroup,
    device: Device,
    opts: { keepEmpty?: boolean } = {},
  ): Array<{
    descriptor: DevicePropertyDescriptor;
    value: string;
    raw: unknown;
  }> {
    const rows: Array<{
      descriptor: DevicePropertyDescriptor;
      value: string;
      raw: unknown;
    }> = [];
    for (const d of this.byGroup(group)) {
      const raw = d.read(device);
      if (!opts.keepEmpty && (raw === undefined || raw === null || raw === "")) {
        continue;
      }
      const value = d.format
        ? d.format(raw, device)
        : raw === null || raw === undefined
          ? "—"
          : String(raw);
      rows.push({ descriptor: d, value, raw });
    }
    return rows;
  }

  clear(): void {
    this.byId.clear();
  }
}

export const devicePropertyRegistry = new DevicePropertyRegistryImpl();
