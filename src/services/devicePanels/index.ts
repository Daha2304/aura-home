import { devicePanelRegistry } from "./DevicePanelRegistry";
import { heroPanelDescriptor } from "./builtin/heroPanel";
import { statusPanelDescriptor } from "./builtin/statusPanel";
import {
  controlsPanelDescriptor,
  sensorsPanelDescriptor,
} from "./builtin/controlsPanel";
import { informationPanelDescriptor } from "./builtin/informationPanel";
import { objectsPanelDescriptor } from "./builtin/objectsPanel";
import {
  networkPanelDescriptor,
  firmwarePanelDescriptor,
} from "./builtin/networkPanel";
import { diagnosticsPanelDescriptor } from "./builtin/diagnosticsPanel";
import { developerPanelDescriptor } from "./builtin/developerPanel";

let bootstrapped = false;

export function bootstrapDevicePanels(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  devicePanelRegistry.register(heroPanelDescriptor);
  devicePanelRegistry.register(statusPanelDescriptor);
  devicePanelRegistry.register(controlsPanelDescriptor);
  devicePanelRegistry.register(sensorsPanelDescriptor);
  devicePanelRegistry.register(informationPanelDescriptor);
  devicePanelRegistry.register(objectsPanelDescriptor);
  devicePanelRegistry.register(networkPanelDescriptor);
  devicePanelRegistry.register(firmwarePanelDescriptor);
  devicePanelRegistry.register(diagnosticsPanelDescriptor);
  devicePanelRegistry.register(developerPanelDescriptor);
}

export { devicePanelRegistry } from "./DevicePanelRegistry";
