import { memo, useMemo } from "react";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { controlFactory } from "@/services/controls/ControlFactory";
import { controlRegistry } from "@/services/controls/ControlRegistry";
import { validateAgainstDescriptor } from "@/services/controls/validation";
import { commandQueue } from "@/services/commands/CommandQueue";
import { errorBus } from "@/services/errors/ErrorBus";
import type { ControlSpec } from "@/models/controlSpec";
import type { CapabilityCategory } from "@/models/capabilityDescriptor";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { Cpu } from "lucide-react";
import { ControlGroupSection } from "./ControlGroupSection";
import { ControlFeedback } from "./ControlFeedback";

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
}

export const UniversalControlRenderer = memo(function UniversalControlRenderer({
  deviceId,
}: UniversalControlRendererProps) {
  const device = useDevicesStore((s) => s.byId(deviceId));
  const specs = useMemo(
    () => (device ? controlFactory.buildForDevice(device) : []),
    [device],
  );

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
      <div className="min-h-[20px]">
        <ControlFeedback deviceId={spec.deviceId} commandKey={spec.commandKey} />
      </div>
    </div>
  );
});
