import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export interface IconButtonProps extends HTMLMotionProps<"button"> {
  size?: "sm" | "md" | "lg";
  variant?: "glass" | "solid" | "ghost";
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className, size = "md", variant = "glass", onClick, ...rest },
    ref,
  ) {
    const haptic = useHapticFeedback();
    return (
      <motion.button
        ref={ref}
        type="button"
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className={cn(
          "inline-grid place-items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          size === "sm" && "h-9 w-9",
          size === "md" && "h-11 w-11",
          size === "lg" && "h-14 w-14",
          variant === "glass" && "glass-panel hairline !p-0 text-foreground",
          variant === "solid" && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          variant === "ghost" && "hover:bg-foreground/10 text-foreground",
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
