import { devicePresentationRegistry } from "./DevicePresentationRegistry";
import { registerBuiltinDevicePresenters } from "./builtin";

export { devicePresentationRegistry } from "./DevicePresentationRegistry";
export type {
  DevicePresenter,
  DevicePresentationContext,
  DeviceDetailSection,
} from "./DevicePresentation";

let bootstrapped = false;

export function bootstrapDevicePresentation(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  registerBuiltinDevicePresenters();
}

// Convenience re-Export für Consumers, die den Registry-Zustand einsehen wollen.
export function listDevicePresenters() {
  return devicePresentationRegistry.presenters();
}
