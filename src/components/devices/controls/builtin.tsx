import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassSwitch } from "@/components/ds/controls/GlassSwitch";
import { GlassSlider } from "@/components/ds/controls/GlassSlider";
import { SegmentedControl } from "@/components/ds/controls/SegmentedControl";
import { IconButton } from "@/components/ds/controls/IconButton";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { Play, Pause, Square, Volume2, VolumeX } from "lucide-react";
import type { ControlProps } from "@/services/controls/ControlRegistry";
import { controlRegistry } from "@/services/controls/ControlRegistry";

/* ---------------- helpers ---------------- */

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asBool(v: unknown): boolean {
  return Boolean(v);
}

function formatDisplay(spec: ControlProps["spec"]): string {
  const fmt = spec.descriptor.format;
  return fmt ? fmt(spec.currentValue) : String(spec.currentValue ?? "—");
}

/* ---------------- Row wrapper ---------------- */

function ControlRow({
  spec,
  children,
  trailing,
}: {
  spec: ControlProps["spec"];
  children?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const Icon = spec.descriptor.icon;
  return (
    <motion.div
      layout
      className="flex flex-col gap-2"
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="truncate text-sm font-medium">{spec.descriptor.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      </div>
      {children}
    </motion.div>
  );
}

/* ---------------- Controls ---------------- */

const PowerToggle = memo(function PowerToggle({ spec, onCommit, disabled }: ControlProps) {
  const value = asBool(spec.currentValue);
  return (
    <ControlRow
      spec={spec}
      trailing={
        <>
          <StatusBadge tone={value ? "success" : "neutral"}>
            {value ? "An" : "Aus"}
          </StatusBadge>
          <GlassSwitch
            aria-label={spec.descriptor.name}
            checked={value}
            onChange={(v) => onCommit(v)}
            disabled={disabled || spec.readOnly}
          />
        </>
      }
    />
  );
});

const PercentageSlider = memo(function PercentageSlider({
  spec,
  onCommit,
  disabled,
}: ControlProps) {
  const value = asNumber(spec.currentValue);
  const { min = 0, max = 100, step = 1 } = spec.descriptor.validation ?? {};
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDisplay(spec)}
        </span>
      }
    >
      <GlassSlider
        aria-label={spec.descriptor.name}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(v) => !disabled && !spec.readOnly && onCommit(v)}
      />
    </ControlRow>
  );
});

const TemperatureSlider = memo(function TemperatureSlider({
  spec,
  onCommit,
  disabled,
}: ControlProps) {
  const raw = spec.capability.kind === "temperature"
    ? (spec.capability.target ?? asNumber(spec.currentValue))
    : asNumber(spec.currentValue);
  const value = asNumber(raw);
  const { min = 5, max = 35, step = 0.5 } = spec.descriptor.validation ?? {};
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span className="text-sm tabular-nums text-muted-foreground">
          {value.toFixed(1)} {spec.descriptor.unit ?? "°C"}
        </span>
      }
    >
      <GlassSlider
        aria-label={spec.descriptor.name}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(v) => !disabled && !spec.readOnly && onCommit(v)}
      />
    </ControlRow>
  );
});

const NumericStepper = memo(function NumericStepper({
  spec,
  onCommit,
  disabled,
}: ControlProps) {
  const value = asNumber(spec.currentValue);
  const { min, max, step = 1 } = spec.descriptor.validation ?? {};
  const clamp = (n: number) => {
    let v = n;
    if (typeof min === "number") v = Math.max(min, v);
    if (typeof max === "number") v = Math.min(max, v);
    return v;
  };
  return (
    <ControlRow
      spec={spec}
      trailing={
        <div className="flex items-center gap-2">
          <IconButton
            aria-label="Verringern"
            onClick={() => !disabled && !spec.readOnly && onCommit(clamp(value - step))}
          >
            −
          </IconButton>
          <span className="min-w-10 text-center text-sm tabular-nums">
            {formatDisplay(spec)}
          </span>
          <IconButton
            aria-label="Erhöhen"
            onClick={() => !disabled && !spec.readOnly && onCommit(clamp(value + step))}
          >
            +
          </IconButton>
        </div>
      }
    />
  );
});

const DropdownEnum = memo(function DropdownEnum({ spec, onCommit, disabled }: ControlProps) {
  const cap = spec.capability;
  const options = cap.kind === "mode" ? cap.options : [];
  const value = String(spec.currentValue ?? "");
  return (
    <ControlRow spec={spec}>
      <select
        aria-label={spec.descriptor.name}
        disabled={disabled || spec.readOnly}
        value={value}
        onChange={(e) => onCommit(e.target.value)}
        className="glass-panel hairline w-full rounded-md bg-transparent px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-background">
            {o}
          </option>
        ))}
      </select>
    </ControlRow>
  );
});

const SegmentedEnum = memo(function SegmentedEnum({ spec, onCommit, disabled }: ControlProps) {
  const cap = spec.capability;
  const options = cap.kind === "mode" ? cap.options : [];
  const value = String(spec.currentValue ?? options[0] ?? "");
  if (options.length === 0 || options.length > 5) {
    return <DropdownEnum spec={spec} onCommit={onCommit} disabled={disabled} />;
  }
  return (
    <ControlRow spec={spec}>
      <SegmentedControl
        aria-label={spec.descriptor.name}
        value={value}
        onChange={(v) => !disabled && !spec.readOnly && onCommit(v)}
        options={options.map((o) => ({ value: o, label: o }))}
      />
    </ControlRow>
  );
});

const ColorPicker = memo(function ColorPicker({ spec, onCommit, disabled }: ControlProps) {
  const value = spec.currentValue as { r: number; g: number; b: number } | undefined;
  const hex = useMemo(() => rgbToHex(value ?? { r: 255, g: 255, b: 255 }), [value]);
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span
          className="hairline h-6 w-6 rounded-full"
          style={{ background: hex }}
          aria-hidden
        />
      }
    >
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={spec.descriptor.name}
          disabled={disabled || spec.readOnly}
          value={hex}
          onChange={(e) => onCommit(hexToRgb(e.target.value))}
          className="h-10 w-16 cursor-pointer rounded-md border-0 bg-transparent"
        />
        <span className="font-mono text-xs text-muted-foreground">{hex.toUpperCase()}</span>
      </div>
    </ControlRow>
  );
});

const MediaTransport = memo(function MediaTransport({
  spec,
  onCommit,
  disabled,
}: ControlProps) {
  const cap = spec.capability;
  const state = cap.kind === "mediaTransport" ? cap.state : "stop";
  const volume = cap.kind === "mediaTransport" ? cap.volume ?? 0 : 0;
  return (
    <ControlRow
      spec={spec}
      trailing={
        <StatusBadge tone={state === "play" ? "success" : "neutral"}>
          {state === "play" ? "Läuft" : state === "pause" ? "Pause" : "Stopp"}
        </StatusBadge>
      }
    >
      <div className="flex items-center gap-2">
        <IconButton
          aria-label="Play"
          onClick={() => !disabled && onCommit({ ...cap, state: "play" })}
        >
          <Play className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label="Pause"
          onClick={() => !disabled && onCommit({ ...cap, state: "pause" })}
        >
          <Pause className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label="Stop"
          onClick={() => !disabled && onCommit({ ...cap, state: "stop" })}
        >
          <Square className="h-4 w-4" />
        </IconButton>
        <div className="ml-2 flex-1">
          <GlassSlider
            aria-label="Lautstärke"
            value={volume}
            min={0}
            max={100}
            step={1}
            onChange={(v) => !disabled && onCommit({ ...cap, volume: v })}
          />
        </div>
        <IconButton
          aria-label={volume === 0 ? "Ton an" : "Stumm"}
          onClick={() => !disabled && onCommit({ ...cap, volume: volume === 0 ? 50 : 0 })}
        >
          {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </IconButton>
      </div>
    </ControlRow>
  );
});

/* ---------- Readouts ---------- */

const BooleanReadout = memo(function BooleanReadout({ spec }: ControlProps) {
  const v = asBool(spec.currentValue);
  return (
    <ControlRow
      spec={spec}
      trailing={<StatusBadge tone={v ? "success" : "neutral"}>{v ? "Ja" : "Nein"}</StatusBadge>}
    />
  );
});

const NumberReadout = memo(function NumberReadout({ spec }: ControlProps) {
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDisplay(spec)}
        </span>
      }
    />
  );
});

const TextReadout = memo(function TextReadout({ spec }: ControlProps) {
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span className="max-w-[60%] truncate text-sm text-muted-foreground">
          {formatDisplay(spec)}
        </span>
      }
    />
  );
});

const EnumReadout = memo(function EnumReadout({ spec }: ControlProps) {
  return (
    <ControlRow
      spec={spec}
      trailing={<StatusBadge tone="accent">{formatDisplay(spec)}</StatusBadge>}
    />
  );
});

const StatusReadout = memo(function StatusReadout({ spec }: ControlProps) {
  return (
    <ControlRow
      spec={spec}
      trailing={<StatusBadge tone="info">{formatDisplay(spec)}</StatusBadge>}
    />
  );
});

const ProgressReadout = memo(function ProgressReadout({ spec }: ControlProps) {
  const value = asNumber(spec.currentValue);
  const { min = 0, max = 100 } = spec.descriptor.validation ?? {};
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDisplay(spec)}
        </span>
      }
    >
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        />
      </div>
    </ControlRow>
  );
});

const EnergyReadout = memo(function EnergyReadout({ spec }: ControlProps) {
  const cap = spec.capability;
  const power = cap.kind === "energy" ? cap.power : 0;
  const total = cap.kind === "energy" ? cap.total : undefined;
  return (
    <ControlRow
      spec={spec}
      trailing={
        <div className="flex items-center gap-2">
          <StatusBadge tone="info">{power.toFixed(1)} W</StatusBadge>
          {typeof total === "number" && (
            <StatusBadge tone="neutral">{total.toFixed(2)} kWh</StatusBadge>
          )}
        </div>
      }
    />
  );
});

const CustomGeneric = memo(function CustomGeneric({ spec }: ControlProps) {
  return (
    <ControlRow
      spec={spec}
      trailing={
        <span className="max-w-[60%] truncate font-mono text-xs text-muted-foreground">
          {safeStringify(spec.currentValue)}
        </span>
      }
    />
  );
});

/* ---------- utils ---------- */

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 255, g: 255, b: 255 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
function safeStringify(v: unknown): string {
  try {
    if (v == null) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  } catch {
    return "—";
  }
}

/* ---------- registration ---------- */

let registered = false;
export function registerBuiltinControls(): void {
  if (registered) return;
  registered = true;
  const R = controlRegistry;
  R.register({ controlType: "power.toggle", component: PowerToggle });
  R.register({ controlType: "switch.glass", component: PowerToggle });
  R.register({ controlType: "slider.percentage", component: PercentageSlider });
  R.register({ controlType: "slider.position", component: PercentageSlider });
  R.register({ controlType: "slider.tilt", component: PercentageSlider });
  R.register({ controlType: "slider.volume", component: PercentageSlider });
  R.register({ controlType: "slider.color-temperature", component: PercentageSlider });
  R.register({ controlType: "slider.temperature", component: TemperatureSlider });
  R.register({ controlType: "stepper.numeric", component: NumericStepper });
  R.register({ controlType: "picker.color", component: ColorPicker });
  R.register({ controlType: "dropdown.enum", component: DropdownEnum });
  R.register({ controlType: "segmented.enum", component: SegmentedEnum });
  R.register({ controlType: "media.transport", component: MediaTransport });
  R.register({ controlType: "readout.boolean", component: BooleanReadout });
  R.register({ controlType: "readout.number", component: NumberReadout });
  R.register({ controlType: "readout.text", component: TextReadout });
  R.register({ controlType: "readout.enum", component: EnumReadout });
  R.register({ controlType: "readout.progress", component: ProgressReadout });
  R.register({ controlType: "readout.status", component: StatusReadout });
  R.register({ controlType: "readout.energy", component: EnergyReadout });
  R.register({ controlType: "custom.generic", component: CustomGeneric });
}
