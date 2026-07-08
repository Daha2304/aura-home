import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  delta?: string;
  accent?: string;
  className?: string;
}

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(function MetricCard(
  { label, value, unit, icon, delta, accent, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("glass-panel hairline flex flex-col justify-between gap-3 p-4", className)}
      style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {icon && <span className="text-accent">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {delta && <div className="text-xs text-muted-foreground">{delta}</div>}
    </div>
  );
});
