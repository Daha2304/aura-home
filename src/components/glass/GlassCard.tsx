import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
  padded?: boolean;
  accent?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { className, interactive, padded = true, accent, style, ...rest },
    ref,
  ) {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "glass-card hairline relative overflow-hidden text-card-foreground",
          padded && "p-4",
          interactive && "cursor-pointer",
          className,
        )}
        style={
          accent
            ? ({ "--accent": accent, ...style } as React.CSSProperties)
            : style
        }
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        {...rest}
      />
    );
  },
);
