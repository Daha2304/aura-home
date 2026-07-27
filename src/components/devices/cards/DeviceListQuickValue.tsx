import { useMemo } from "react";
import type { Device } from "@/models/device";
import type { ControlSpec } from "@/models/controlSpec";
import { Switch } from "@/components/ui/switch";
import { controlFactory } from "@/services/controls/ControlFactory";
import { commandQueue } from "@/services/commands/CommandQueue";

const IGNORED_SENSOR_KINDS = new Set(["battery", "signal"]);
const SWITCH_CONTROL_TYPES = new Set(["power.toggle", "switch.glass"]);
const POWER_KINDS = new Set(["onOff", "power", "boolean"]);

interface Props {
  device: Device;
}

export function DeviceListQuickValue({ device }: Props) {
  const preview = useMemo(() => pickPreview(device), [device]);

  if (!preview) return <div className="w-16 shrink-0" aria-hidden="true" />;

  if (preview.kind === "switch") {
    return (
      <div className="flex w-16 shrink-0 justify-end">
        <Switch
          checked={preview.value}
          aria-label={`${device.name} schalten`}
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
  const switchSpecs = writable.filter(isPrimarySwitch);

  if (switchSpecs.length === 1) {
    const spec = switchSpecs[0];
    return {
      kind: "switch",
      spec,
      value: Boolean(spec.currentValue),
    };
  }

  if (switchSpecs.length > 1 || writable.some((spec) => spec.controlType === "button.action")) {
    return null;
  }

  const sensors = specs.filter(isPreviewSensor);
  if (sensors.length !== 1) return null;

  const sensor = sensors[0];
  return {
    kind: "readout",
    value: formatSensorValue(sensor),
  };
}

function isPrimarySwitch(spec: ControlSpec): boolean {
  if (!SWITCH_CONTROL_TYPES.has(spec.controlType)) return false;
  if (typeof spec.currentValue !== "boolean") return false;
  if (!POWER_KINDS.has(spec.capabilityKind)) return false;
  return !getSpecText(spec).includes("state");
}

function isPreviewSensor(spec: ControlSpec): boolean {
  if (!spec.readOnly) return false;
  if (IGNORED_SENSOR_KINDS.has(spec.capabilityKind)) return false;
  if (isIgnoredSensorText(getSpecText(spec))) return false;
  return ["boolean", "number", "string", "enum"].includes(spec.descriptor.dataType);
}

function formatSensorValue(spec: ControlSpec): string {
  if (typeof spec.currentValue === "boolean") {
    if (spec.valueLabels)
      return spec.currentValue
        ? (spec.valueLabels.true ?? "Ja")
        : (spec.valueLabels.false ?? "Nein");
    const text = getSpecText(spec);
    if (isOpeningText(text)) return spec.currentValue ? "Offen" : "Geschlossen";
    if (isOccupancyText(text)) return spec.currentValue ? "Belegt" : "Frei";
    return spec.currentValue ? "Ja" : "Nein";
  }

  if (spec.descriptor.format) return spec.descriptor.format(spec.currentValue);

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

function getSpecText(spec: ControlSpec): string {
  const cap = spec.capability as {
    id?: string;
    label?: string;
    kind?: string;
    unit?: string;
    meta?: Record<string, unknown>;
  };
  return [
    spec.capabilityId,
    spec.capabilityKind,
    spec.displayLabel,
    cap.id,
    cap.label,
    cap.kind,
    typeof cap.meta?.role === "string" ? cap.meta.role : undefined,
    typeof cap.meta?.stateId === "string" ? cap.meta.stateId : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isIgnoredSensorText(text: string): boolean {
  return /\b(battery|batterie|signal|rssi|linkquality|quality)\b/.test(text);
}

function isOpeningText(text: string): boolean {
  return /fenster|window|door|tuer|tür|opened|open/.test(text);
}

function isOccupancyText(text: string): boolean {
  return /motion|occupancy|presence|anwesenheit|bewegung|belegt/.test(text);
}
