import type { Capability } from "@/models/capability";

/**
 * The CommandQueue + CommandTracker use the capability's own `id` as
 * the wire key — writing to `device.capabilities[i].value` when the
 * `id` matches. Centralised here so all producers agree.
 */
export function commandKeyForCapability(cap: Capability): string {
  return cap.id;
}
