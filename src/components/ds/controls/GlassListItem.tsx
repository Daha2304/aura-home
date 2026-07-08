import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { springSnappy } from "@/themes/motion";

export interface GlassListItemProps extends Omit<HTMLMotionProps<"button">, "title"> {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  interactive?: boolean;
}

export const GlassListItem = forwardRef<HTMLButtonElement, GlassListItemProps>(
  function GlassListItem(
    {
      title,
      description,
      leading,
      trailing,
      showChevron,
      interactive = true,
      className,
      ...rest
    },
    ref,
  ) {
    const Comp = interactive ? motion.button : (motion.div as unknown as typeof motion.button);
    return (
      <Comp
        ref={ref}
        type={interactive ? "button" : undefined}
        whileTap={interactive ? { scale: 0.99 } : undefined}
        transition={springSnappy}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left",
          interactive && "hover:bg-foreground/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        {...rest}
      >
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium">{title}</div>
          {description && (
            <div className="truncate text-xs text-muted-foreground">{description}</div>
          )}
        </div>
        {trailing}
        {showChevron && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </Comp>
    );
  },
);
