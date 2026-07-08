import { memo, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { PropertyList } from "@/components/devices/properties/PropertyList";
import { useCommandsStore } from "@/store/slices/commandsStore";
import { StatusBadge, type StatusTone } from "@/components/ds/controls/StatusBadge";
import type { CommandState } from "@/models/command";

const MAX_HISTORY = 8;

const TONE_BY_STATE: Record<CommandState, StatusTone> = {
  queued: "info",
  sending: "info",
  sent: "info",
  acknowledged: "info",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
  retrying: "warning",
};

const DiagnosticsPanelComponent = memo(function DiagnosticsPanel({
  device,
}: DevicePanelProps) {
  const history = useCommandsStore((s) => s.history);
  const active = useCommandsStore((s) => s.active);
  const commands = useMemo(
    () =>
      [...active, ...history]
        .filter((c) => c.deviceId === device.id)
        .slice(0, MAX_HISTORY),
    [active, history, device.id],
  );

  return (
    <div className="flex flex-col gap-3">
      <PropertyList device={device} group="diagnostics" />
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
          Letzte Befehle
        </p>
        {commands.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Befehle registriert.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            <ul className="flex flex-col gap-1.5">
              {commands.map((c) => (
                <motion.li
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center justify-between gap-2 rounded-lg bg-foreground/[0.03] px-2 py-1.5"
                >
                  <span className="truncate text-xs font-mono text-muted-foreground">
                    {c.key} · {new Date(c.updatedAt).toLocaleTimeString()}
                  </span>
                  <StatusBadge tone={TONE_BY_STATE[c.state]}>
                    {c.state}
                  </StatusBadge>
                </motion.li>
              ))}
            </ul>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
});

export const diagnosticsPanelDescriptor: DevicePanelDescriptor = {
  id: "diagnostics",
  title: "Diagnose",
  group: "diagnostics",
  priority: 300,
  isVisible: () => true,
  component: DiagnosticsPanelComponent,
};
