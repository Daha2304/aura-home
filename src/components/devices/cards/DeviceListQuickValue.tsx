import { useMemo } from "react";
import type { Device } from "@/models/device";
import type { ControlSpec } from "@/models/controlSpec";
import { Switch } from "@/components/ui/switch";
import { controlFactory } from "@/services/controls/ControlFactory";
import { commandQueue } from "@/services/commands/CommandQueue";

const IGNORED_SENSOR_KINDS = new Set(["battery", "signal"]);
const SWITCH_CONTROL_TYPES = new Set(["power.toggle", "switch.glass"]);

interface Props {
  device: Device;
}

export function DeviceListQuickValue({ device }: Props) {
  const preview = useMemo(() => pickPreview(device), [device]);

  if (!preview) return <div className="w-16 shrink-0" aria-hidden="true" />;

  if (preview.kind === "switch") {
    return (
      <div className="flex w-16 shrink-0 justify-end" onClick={(event) => event.preventDefault()}>
        <Switch
          checked={preview.value}
          aria-label={`${device.name} schalten`}
          onClick={(event) => event.stopPropagation()}
          onCheckedChange={(checked) => {
            commandQueue.enqueue(device.id, preview.spec.commandKey, checked, {
              optimistic: true,
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-16 shrink-0 truncate text-right text-sm font-semibold text-muted-foreground">
      {preview.value}
    </div>
  );
}

type Preview =
  | {
      kind: "switch";
      spec: ControlSpec;
      value: boolean;
    }
  | {
      kind: "readout";
      value: string;
    };

function pickPreview(device: Device): Preview | null {
  const specs = controlFactory.buildForDevice(device);
  const writable = specs.filter((spec) => !spec.readOnly);

  if (writable.length === 1) {
    const spec = writable[0];
    if (isBooleanSwitch(spec)) {
      return {
        kind: "switch",
        spec,
        value: Boolean(spec.currentValue),
      };
    }
  }

  if (writable.length > 0) return null;

  const sensors = specs.filter(isPreviewSensor);
  if (sensors.length !== 1) return null;

  const sensor = sensors[0];
  return {
    kind: "readout",
    value: formatSensorValue(sensor),
  };
}

function isBooleanSwitch(spec: ControlSpec): boolean {
  return SWITCH_CONTROL_TYPES.has(spec.controlType) && typeof spec.currentValue === "boolean";
}

function isPreviewSensor(spec: ControlSpec): boolean {
  if (!spec.readOnly) return false;
  if (IGNORED_SENSOR_KINDS.has(spec.capabilityKind)) return false;
  return ["boolean", "number", "string", "enum"].includes(spec.descriptor.dataType);
}

function formatSensorValue(spec: ControlSpec): string {
  if (spec.descriptor.format) return spec.descriptor.format(spec.currentValue);

  if (typeof spec.currentValue === "boolean") {
    if (spec.valueLabels)
      return spec.currentValue
        ? (spec.valueLabels.true ?? "Ja")
        : (spec.valueLabels.false ?? "Nein");
    return spec.currentValue ? "Ja" : "Nein";
  }

  if (typeof spec.currentValue === "number" && Number.isFinite(spec.currentValue)) {
    const unit =
      "unit" in spec.capability && typeof spec.capability.unit === "string"
        ? spec.capability.unit
        : spec.descriptor.unit;
    const value = Number.isInteger(spec.currentValue)
      ? String(spec.currentValue)
      : spec.currentValue.toLocaleString("de-DE", { maximumFractionDigits: 1 });
    return unit ? `${value} ${unit}` : value;
  }

  if (spec.currentValue === null || spec.currentValue === undefined || spec.currentValue === "")
    return "-";
  return String(spec.currentValue);
}
