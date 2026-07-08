import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhaseState = "idle" | "running" | "success" | "error";

export interface Phase {
  id: string;
  label: string;
  description?: string;
  state: PhaseState;
}

interface PhaseListProps {
  phases: Phase[];
}

export function PhaseList({ phases }: PhaseListProps) {
  return (
    <ul className="space-y-2.5">
      {phases.map((p, idx) => (
        <motion.li
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06, type: "spring", stiffness: 260, damping: 24 }}
          className={cn(
            "glass-panel flex items-center gap-3 rounded-2xl px-4 py-3",
            p.state === "error" && "ring-1 ring-destructive/50",
            p.state === "success" && "ring-1 ring-success/40",
          )}
        >
          <PhaseIcon state={p.state} />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold">{p.label}</div>
            {p.description && (
              <div className="truncate text-xs text-muted-foreground">
                {p.description}
              </div>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

function PhaseIcon({ state }: { state: PhaseState }) {
  return (
    <div
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors",
        state === "idle" && "bg-white/5 text-muted-foreground",
        state === "running" && "bg-primary/15 text-primary",
        state === "success" && "bg-success/15 text-success",
        state === "error" && "bg-destructive/15 text-destructive",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "running" && (
          <motion.span
            key="run"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
          </motion.span>
        )}
        {state === "success" && (
          <motion.span
            key="ok"
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        )}
        {state === "error" && (
          <motion.span
            key="err"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertCircle className="h-4 w-4" />
          </motion.span>
        )}
        {state === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-1.5 w-1.5 rounded-full bg-current"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
