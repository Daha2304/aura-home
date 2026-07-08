import type { Device } from "@/models/device";
import type { Capability } from "@/models/capability";
import { LightControl } from "./LightControl";
import { DimmerControl } from "./DimmerControl";
import { RgbControl } from "./RgbControl";
import { SwitchControl } from "./SwitchControl";
import { SensorControl } from "./SensorControl";
import { ThermostatControl } from "./ThermostatControl";
import { BlindsControl } from "./BlindsControl";
import { MediaControl } from "./MediaControl";
import { CameraControl } from "./CameraControl";
import { GenericControl } from "./GenericControl";

interface Props {
  device: Device;
  capability: Capability;
}

/**
 * Maps a capability to the appropriate control component.
 * Controls are UI-only at this stage — they emit no side effects.
 */
export function ControlForCapability({ device, capability }: Props) {
  switch (capability.kind) {
    case "onOff":
      return <SwitchControl device={device} capability={capability} />;
    case "dimmer":
      return <DimmerControl device={device} capability={capability} />;
    case "rgb":
      return <RgbControl device={device} capability={capability} />;
    case "temperature":
      return device.type === "thermostat" || device.type === "heating" ? (
        <ThermostatControl device={device} capability={capability} />
      ) : (
        <SensorControl device={device} capability={capability} />
      );
    case "humidity":
      return <SensorControl device={device} capability={capability} />;
    case "position":
      return <BlindsControl device={device} capability={capability} />;
    case "mediaTransport":
      return <MediaControl device={device} capability={capability} />;
    case "stream":
      return <CameraControl device={device} capability={capability} />;
    default:
      return <GenericControl device={device} capability={capability} />;
  }
}

// Re-export for convenience
export { LightControl };
