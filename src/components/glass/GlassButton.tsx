import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  function GlassButton(
    { className, variant = "ghost", size = "md", onClick, ...rest },
    ref,
  ) {
    const haptic = useHapticFeedback();
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          size === "sm" && "h-9 px-3 text-sm",
          size === "md" && "h-11 px-4 text-[15px]",
          size === "lg" && "h-14 px-6 text-base",
          variant === "primary" &&
            "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          variant === "ghost" &&
            "glass-panel !p-0 text-foreground hover:bg-white/10",
          variant === "danger" &&
            "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25",
          className,
        )}
        onClick={(e) => {
          haptic("light");
          onClick?.(e);
        }}
        {...rest}
      />
    );
  },
);
