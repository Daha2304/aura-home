import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatusTone, string> = {
  neutral: "text-muted-foreground",
  success: "text-[color:var(--success)]",
  warning: "text-[color:var(--warning)]",
  danger: "text-[color:var(--destructive)]",
  info: "text-[color:var(--info)]",
};

export interface StatusCardProps {
  label: string;
  value: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export const StatusCard = forwardRef<HTMLDivElement, StatusCardProps>(function StatusCard(
  { label, value, tone = "neutral", icon, hint, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("glass-panel hairline flex items-center gap-3 p-4", className)}
    >
      {icon && (
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15", toneClasses[tone])}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={cn("truncate text-base font-semibold", toneClasses[tone])}>
          {value}
        </div>
        {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
});
