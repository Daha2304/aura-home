import { memo } from "react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";

const ObjectsPanelComponent = memo(function ObjectsPanel({ device }: DevicePanelProps) {
  const functions = [...(device.functions ?? [])].sort((first, second) => first.id.localeCompare(second.id));

  return (
    <div className="flex flex-col gap-2">
      {functions.map((fn) => (
        <div
          key={fn.id}
          className="rounded-lg border border-white/10 bg-foreground/[0.03] px-3 py-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {fn.label || fn.id.split(".").at(-1)}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {fn.id}
              </p>
            </div>
            <StatusBadge tone={fn.readonly ? "neutral" : "info"}>
              {fn.readonly ? "lesen" : "steuerbar"}
            </StatusBadge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge tone="neutral">{fn.kind}</StatusBadge>
            {typeof fn.meta?.role === "string" && fn.meta.role.length > 0 && (
              <StatusBadge tone="neutral">{fn.meta.role}</StatusBadge>
            )}
            {fn.unit && <StatusBadge tone="neutral">{fn.unit}</StatusBadge>}
            <StatusBadge tone="neutral">{formatValue(fn.value)}</StatusBadge>
          </div>
        </div>
      ))}
    </div>
  );
});

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "kein Wert";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "Objekt";
    }
  }

  return String(value);
}

export const objectsPanelDescriptor: DevicePanelDescriptor = {
  id: "objects",
  title: "Objekte",
  group: "information",
  priority: 680,
  isVisible: (device) => (device.functions?.length ?? 0) > 0,
  component: ObjectsPanelComponent,
};
