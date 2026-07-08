import type { Device } from "@/models/device";
import type { OnOffCapability } from "@/models/capability";
import { SwitchControl } from "./SwitchControl";

export function LightControl(props: { device: Device; capability: OnOffCapability }) {
  return <SwitchControl {...props} />;
}
