import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/themes/motion";

export interface ActionCardProps extends Omit<HTMLMotionProps<"button">, "title"> {
  title: string;
  description?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  accent?: string;
}

export const ActionCard = forwardRef<HTMLButtonElement, ActionCardProps>(
  function ActionCard(
    { title, description, icon, trailing, accent, className, ...rest },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type="button"
        whileTap={{ scale: 0.98 }}
        transition={springSnappy}
        className={cn(
          "glass-panel hairline flex w-full items-center gap-3 p-4 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
        {...rest}
      >
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/20 text-accent">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{title}</div>
          {description && (
            <div className="truncate text-xs text-muted-foreground">{description}</div>
          )}
        </div>
        {trailing && <div className="shrink-0 text-muted-foreground">{trailing}</div>}
      </motion.button>
    );
  },
);
