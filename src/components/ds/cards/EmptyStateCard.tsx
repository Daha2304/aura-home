import { forwardRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateCardProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyStateCard = forwardRef<HTMLDivElement, EmptyStateCardProps>(
  function EmptyStateCard(
    { icon: Icon = Sparkles, title, description, action, className },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel hairline flex flex-col items-center gap-3 p-10 text-center",
          className,
        )}
      >
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-accent/15 text-accent">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          {description && (
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    );
  },
);
