import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-foreground/10 text-foreground",
  success: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  warning: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
  danger: "bg-destructive/15 text-destructive",
  info: "bg-[color:var(--info)]/15 text-[color:var(--info)]",
  accent: "bg-accent/15 text-accent",
};

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: StatusTone;
  icon?: ReactNode;
  className?: string;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  function StatusBadge({ children, tone = "neutral", icon, className }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
          toneClasses[tone],
          className,
        )}
      >
        {icon}
        {children}
      </span>
    );
  },
);
