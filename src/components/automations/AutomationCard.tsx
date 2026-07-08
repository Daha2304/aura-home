import type { Automation } from "@/models/automation";
import { GlassCard } from "@/components/glass/GlassCard";
import { Switch } from "@/components/ui/switch";
import { useAutomationsStore } from "@/store/slices/automationsStore";

export function AutomationCard({ automation }: { automation: Automation }) {
  const toggle = useAutomationsStore((s) => s.toggle);
  return (
    <GlassCard className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{automation.name}</div>
        <div className="text-xs text-muted-foreground">
          {automation.triggers.length} Auslöser · {automation.actions.length} Aktionen
        </div>
      </div>
      <Switch
        checked={automation.enabled}
        onCheckedChange={() => toggle(automation.id)}
      />
    </GlassCard>
  );
}
