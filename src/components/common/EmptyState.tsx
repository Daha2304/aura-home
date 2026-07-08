import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Sparkles, title, description, action }: Props) {
  return (
    <GlassPanel className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
        <Icon className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </GlassPanel>
  );
}
