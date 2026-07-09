import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Star, Workflow, Zap } from "lucide-react";
import type { Automation } from "@/models/automation";
import { GlassCard } from "@/components/glass/GlassCard";
import { automationExecutor, automationManager } from "@/services/automations";
import {
  useAutomationExecutionsStore,
  selectLatestAutomationExecution,
} from "@/store/slices/automationExecutionsStore";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Props {
  automation: Automation;
  onOpen?: (id: string) => void;
}

export const AutomationCard = memo(function AutomationCard({ automation, onOpen }: Props) {
  const latest = useAutomationExecutionsStore(selectLatestAutomationExecution(automation.id));
  const running = latest?.status === "running" || latest?.status === "planned";
  const progress = useMemo(() => {
    if (!latest || latest.progress.total === 0) return 0;
    const done = latest.progress.completed + latest.progress.failed + latest.progress.cancelled;
    return Math.min(1, done / latest.progress.total);
  }, [latest]);

  return (
    <GlassCard
      interactive
      accent={automation.color}
      onClick={() => onOpen?.(automation.id)}
      className="flex items-center gap-3"
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-accent"
        style={{ background: automation.color ?? "oklch(0.75 0.14 250 / 0.2)" }}
      >
        <Workflow className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-[15px] font-semibold">{automation.name}</div>
          {automation.favorite && <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          {automation.triggers.length} · {automation.actions.length} Aktionen
        </div>
        {running && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
      <Switch
        checked={automation.enabled}
        onCheckedChange={(v) => {
          automationManager.setEnabled(automation.id, v);
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={`${automation.name} aktiv`}
      />
      <button
        type="button"
        aria-label={`Automation ${automation.name} auslösen`}
        onClick={(e) => {
          e.stopPropagation();
          automationExecutor.run(automation.id, { triggerId: "manual" });
        }}
        disabled={running || !automation.enabled}
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 transition",
          (running || !automation.enabled) && "opacity-50",
        )}
      >
        <Play className="h-4 w-4" fill="currentColor" />
      </button>
    </GlassCard>
  );
});
