import { GlassPanel } from "@/components/glass/GlassPanel";
import type { ReactNode } from "react";

export function ControlPanel({
  label,
  value,
  children,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <GlassPanel className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        {value && <span className="text-muted-foreground">{value}</span>}
      </div>
      {children}
    </GlassPanel>
  );
}
