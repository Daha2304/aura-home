import { memo, useMemo, useState } from "react";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { controlFactory } from "@/services/controls/ControlFactory";
import { controlRegistry } from "@/services/controls/ControlRegistry";
import { validateAgainstDescriptor } from "@/services/controls/validation";
import { commandQueue } from "@/services/commands/CommandQueue";
import { errorBus } from "@/services/errors/ErrorBus";
import type { ControlSpec } from "@/models/controlSpec";
import type { Device } from "@/models/device";
import type { CapabilityCategory } from "@/models/capabilityDescriptor";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { Cpu, Pencil } from "lucide-react";
import { ControlGroupSection } from "./ControlGroupSection";
import { ControlFeedback } from "./ControlFeedback";
import { IconButton } from "@/components/ds/controls/IconButton";
import { GlassButton } from "@/components/glass/GlassButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORY_ORDER: CapabilityCategory[] = [
  "general",
  "lighting",
  "climate",
  "media",
  "sensor",
  "energy",
  "network",
  "system",
  "custom",
];

export interface UniversalControlRendererProps {
  deviceId: string;
  mode?: "all" | "writable" | "readonly";
}

export const UniversalControlRenderer = memo(function UniversalControlRenderer({
  deviceId,
  mode = "all",
}: UniversalControlRendererProps) {
  const device = useDevicesStore((s) => s.byId(deviceId));
  const specs = useMemo(() => {
    const all = device ? controlFactory.buildForDevice(device) : [];

    if (mode === "writable") return all.filter((spec) => !spec.readOnly);
    if (mode === "readonly") return all.filter((spec) => spec.readOnly);

    return all;
  }, [device, mode]);

  const grouped = useMemo(() => {
    const map = new Map<CapabilityCategory, ControlSpec[]>();
    for (const s of specs) {
      const list = map.get(s.group) ?? [];
      list.push(s);
      map.set(s.group, list);
    }
    return map;
  }, [specs]);

  if (!device) return null;
  if (specs.length === 0) {
    return (
      <EmptyStateCard
        icon={Cpu}
        title="Keine Steuerung"
        description="Dieses Gerät meldet aktuell keine steuerbaren Funktionen."
      />
    );
  }

  return (
    <>
      {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((cat) => (
        <ControlGroupSection key={cat} category={cat}>
          {grouped.get(cat)!.map((spec) => (
            <ControlRow key={spec.id} spec={spec} />
          ))}
        </ControlGroupSection>
      ))}
    </>
  );
});

const ControlRow = memo(function ControlRow({ spec }: { spec: ControlSpec }) {
  const binding = controlRegistry.resolve(spec.controlType);
  const device = useDevicesStore((s) => s.byId(spec.deviceId));
  const [editorOpen, setEditorOpen] = useState(false);
  if (!binding) return null;
  const Component = binding.component;

  const handleCommit = (raw: unknown) => {
    if (spec.readOnly) return;
    try {
      const value = validateAgainstDescriptor(raw, spec.descriptor);
      commandQueue.enqueue(spec.deviceId, spec.commandKey, value, {
        optimistic: true,
      });
    } catch (err) {
      errorBus.report(err, {
        deviceId: spec.deviceId,
        capabilityId: spec.capabilityId,
      });
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Component spec={spec} onCommit={handleCommit} />
        </div>
        <IconButton
          aria-label="Anzeige anpassen"
          size="sm"
          variant="ghost"
          onClick={() => setEditorOpen(true)}
          className="mt-1 shrink-0"
        >
          <Pencil className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="h-6 overflow-hidden">
        <ControlFeedback deviceId={spec.deviceId} commandKey={spec.commandKey} />
      </div>
      {device && (
        <ControlOverrideDialog
          open={editorOpen}
          device={device}
          spec={spec}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
});

type ControlOverrides = Record<
  string,
  {
    label?: string;
    valueLabels?: {
      true?: string;
      false?: string;
    };
  }
>;

function ControlOverrideDialog({
  open,
  device,
  spec,
  onClose,
}: {
  open: boolean;
  device: Device;
  spec: ControlSpec;
  onClose: () => void;
}) {
  const existing = readOverrides(device)[spec.commandKey] ?? {};
  const fallbackLabel = spec.displayLabel ?? ("label" in spec.capability ? spec.capability.label : undefined) ?? spec.descriptor.name;
  const [label, setLabel] = useState(existing.label ?? "");
  const [trueLabel, setTrueLabel] = useState(existing.valueLabels?.true ?? "");
  const [falseLabel, setFalseLabel] = useState(existing.valueLabels?.false ?? "");
  const isBoolean = typeof spec.currentValue === "boolean" || spec.descriptor.dataType === "boolean";

  const save = () => {
    const overrides = readOverrides(device);
    const nextOverride = {
      label: label.trim() || undefined,
      valueLabels: {
        true: trueLabel.trim() || undefined,
        false: falseLabel.trim() || undefined,
      },
    };
    const hasValueLabels = Boolean(nextOverride.valueLabels.true || nextOverride.valueLabels.false);
    const nextOverrides = { ...overrides };

    if (nextOverride.label || hasValueLabels) {
      nextOverrides[spec.commandKey] = {
        ...(nextOverride.label ? { label: nextOverride.label } : {}),
        ...(hasValueLabels ? { valueLabels: nextOverride.valueLabels } : {}),
      };
    } else {
      delete nextOverrides[spec.commandKey];
    }

    useDevicesStore.getState().upsertDevice({
      ...device,
      customProperties: {
        ...(device.customProperties ?? {}),
        controlOverrides: nextOverrides,
      },
    });
    onClose();
  };

  const reset = () => {
    const nextOverrides = { ...readOverrides(device) };
    delete nextOverrides[spec.commandKey];
    useDevicesStore.getState().upsertDevice({
      ...device,
      customProperties: {
        ...(device.customProperties ?? {}),
        controlOverrides: nextOverrides,
      },
    });
    setLabel("");
    setTrueLabel("");
    setFalseLabel("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Anzeige anpassen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`${spec.id}-label`}>Name</Label>
            <Input
              id={`${spec.id}-label`}
              value={label}
              placeholder={fallbackLabel}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          {isBoolean && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`${spec.id}-true`}>Wenn wahr</Label>
                <Input
                  id={`${spec.id}-true`}
                  value={trueLabel}
                  placeholder="Ja"
                  onChange={(event) => setTrueLabel(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${spec.id}-false`}>Wenn falsch</Label>
                <Input
                  id={`${spec.id}-false`}
                  value={falseLabel}
                  placeholder="Nein"
                  onChange={(event) => setFalseLabel(event.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <GlassButton variant="ghost" onClick={reset}>Zurücksetzen</GlassButton>
          <GlassButton variant="primary" onClick={save}>Speichern</GlassButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function readOverrides(device: { customProperties?: Record<string, unknown> }): ControlOverrides {
  const overrides = device.customProperties?.controlOverrides;
  return overrides && typeof overrides === "object" ? (overrides as ControlOverrides) : {};
}
