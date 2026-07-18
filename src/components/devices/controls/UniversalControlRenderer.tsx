import { memo, useEffect, useMemo, useState } from "react";
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
import { Cpu } from "lucide-react";
import { ControlGroupSection } from "./ControlGroupSection";
import { ControlFeedback } from "./ControlFeedback";
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
  grouped?: boolean;
  emptyState?: boolean;
}

export const UniversalControlRenderer = memo(function UniversalControlRenderer({
  deviceId,
  mode = "all",
  grouped = true,
  emptyState = true,
}: UniversalControlRendererProps) {
  const device = useDevicesStore((s) => s.byId(deviceId));
  const specs = useMemo(() => {
    const all = device ? controlFactory.buildForDevice(device) : [];

    if (mode === "writable") return all.filter((spec) => !spec.readOnly);
    if (mode === "readonly") return all.filter((spec) => spec.readOnly);

    return all;
  }, [device, mode]);

  const groupedSpecs = useMemo(() => {
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
    return emptyState ? (
      <EmptyStateCard
        icon={Cpu}
        title="Keine Steuerung"
        description="Dieses Gerät meldet aktuell keine steuerbaren Funktionen."
      />
    ) : null;
  }

  if (!grouped) {
    return (
      <div className="flex flex-col gap-4">
        {specs.map((spec) => (
          <ControlRow key={spec.id} spec={spec} />
        ))}
      </div>
    );
  }

  return (
    <>
      {CATEGORY_ORDER.filter((c) => groupedSpecs.has(c)).map((cat) => (
        <ControlGroupSection key={cat} category={cat}>
          {groupedSpecs.get(cat)!.map((spec) => (
            <ControlRow key={spec.id} spec={spec} />
          ))}
        </ControlGroupSection>
      ))}
    </>
  );
});

const ControlRow = memo(function ControlRow({ spec }: { spec: ControlSpec }) {
  const binding = controlRegistry.resolve(spec.controlType);
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
      <Component spec={spec} onCommit={handleCommit} />
      <div className="h-6 overflow-hidden">
        <ControlFeedback deviceId={spec.deviceId} commandKey={spec.commandKey} />
      </div>
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

export function DeviceControlOverridesDialog({
  open,
  device,
  onClose,
}: {
  open: boolean;
  device: Device;
  onClose: () => void;
}) {
  const specs = useMemo(() => controlFactory.buildForDevice(device), [device]);
  const [drafts, setDrafts] = useState<Record<string, { label: string; trueLabel: string; falseLabel: string }>>({});

  useEffect(() => {
    const overrides = readOverrides(device);
    setDrafts(
      Object.fromEntries(
        specs.map((spec) => {
          const existing = overrides[spec.commandKey] ?? {};
          return [
            spec.commandKey,
            {
              label: existing.label ?? "",
              trueLabel: existing.valueLabels?.true ?? "",
              falseLabel: existing.valueLabels?.false ?? "",
            },
          ];
        }),
      ),
    );
  }, [device, specs, open]);

  const updateDraft = (key: string, patch: Partial<{ label: string; trueLabel: string; falseLabel: string }>) => {
    setDrafts((current) => ({
      ...current,
      [key]: { label: "", trueLabel: "", falseLabel: "", ...(current[key] ?? {}), ...patch },
    }));
  };

  const save = () => {
    const nextOverrides = { ...readOverrides(device) };

    for (const spec of specs) {
      const draft = drafts[spec.commandKey] ?? { label: "", trueLabel: "", falseLabel: "" };
      const label = draft.label.trim();
      const trueLabel = draft.trueLabel.trim();
      const falseLabel = draft.falseLabel.trim();
      const hasValueLabels = Boolean(trueLabel || falseLabel);

      if (label || hasValueLabels) {
        nextOverrides[spec.commandKey] = {
          ...(label ? { label } : {}),
          ...(hasValueLabels ? { valueLabels: { true: trueLabel || undefined, false: falseLabel || undefined } } : {}),
        };
      } else {
        delete nextOverrides[spec.commandKey];
      }
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
    for (const spec of specs) {
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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aktionen anpassen</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          {specs.map((spec) => {
            const fallbackLabel = spec.displayLabel ?? ("label" in spec.capability ? spec.capability.label : undefined) ?? spec.descriptor.name;
            const isBoolean = typeof spec.currentValue === "boolean" || spec.descriptor.dataType === "boolean";
            const draft = drafts[spec.commandKey] ?? { label: "", trueLabel: "", falseLabel: "" };

            return (
              <div key={spec.id} className="grid gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="grid gap-2">
                  <Label htmlFor={`${spec.id}-label`}>{fallbackLabel}</Label>
                  <Input
                    id={`${spec.id}-label`}
                    value={draft.label}
                    placeholder={fallbackLabel}
                    onChange={(event) => updateDraft(spec.commandKey, { label: event.target.value })}
                  />
                </div>
                {isBoolean && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor={`${spec.id}-true`}>Wenn wahr</Label>
                      <Input
                        id={`${spec.id}-true`}
                        value={draft.trueLabel}
                        placeholder="Ja"
                        onChange={(event) => updateDraft(spec.commandKey, { trueLabel: event.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`${spec.id}-false`}>Wenn falsch</Label>
                      <Input
                        id={`${spec.id}-false`}
                        value={draft.falseLabel}
                        placeholder="Nein"
                        onChange={(event) => updateDraft(spec.commandKey, { falseLabel: event.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {specs.length === 0 && (
            <div className="text-sm text-muted-foreground">Dieses Gerät hat aktuell keine Aktionen.</div>
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
