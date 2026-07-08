import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X, RotateCw } from "lucide-react";
import { useCommandsStore } from "@/store/slices/commandsStore";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import type { Command } from "@/models/command";

export interface ControlFeedbackProps {
  deviceId: string;
  commandKey: string;
}

function pickActive(commands: Command[]): Command | undefined {
  return commands.find((c) => c.state !== "completed");
}

export const ControlFeedback = memo(function ControlFeedback({
  deviceId,
  commandKey,
}: ControlFeedbackProps) {
  const active = useCommandsStore((s) => s.active);
  const history = useCommandsStore((s) => s.history);
  const cmd = useMemo(() => {
    const a = active.find((c) => c.deviceId === deviceId && c.key === commandKey);
    if (a) return a;
    return history.find((c) => c.deviceId === deviceId && c.key === commandKey);
  }, [active, history, deviceId, commandKey]);

  if (!cmd) return null;

  const { tone, label, icon } = describe(cmd);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={cmd.state}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
      >
        <StatusBadge tone={tone} icon={icon}>
          {label}
        </StatusBadge>
      </motion.div>
    </AnimatePresence>
  );
});

function describe(cmd: Command): {
  tone: "info" | "success" | "danger" | "warning" | "neutral";
  label: string;
  icon: React.ReactNode;
} {
  switch (cmd.state) {
    case "queued":
      return { tone: "info", label: "In Warteschlange", icon: <Loader2 className="h-3 w-3 animate-spin" /> };
    case "sending":
    case "sent":
      return { tone: "info", label: "Sende…", icon: <Loader2 className="h-3 w-3 animate-spin" /> };
    case "retrying":
      return { tone: "warning", label: "Wiederhole…", icon: <RotateCw className="h-3 w-3 animate-spin" /> };
    case "acknowledged":
      return { tone: "info", label: "Bestätigt", icon: <Check className="h-3 w-3" /> };
    case "completed":
      return { tone: "success", label: "Erledigt", icon: <Check className="h-3 w-3" /> };
    case "failed":
      return { tone: "danger", label: cmd.error?.message ?? "Fehler", icon: <X className="h-3 w-3" /> };
    case "cancelled":
      return { tone: "neutral", label: "Abgebrochen", icon: <X className="h-3 w-3" /> };
    default:
      return { tone: "neutral", label: cmd.state, icon: null };
  }
}
