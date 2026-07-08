import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export interface FloatingButtonProps extends HTMLMotionProps<"button"> {
  "aria-label": string;
}

export const FloatingButton = forwardRef<HTMLButtonElement, FloatingButtonProps>(
  function FloatingButton({ className, onClick, children, ...rest }, ref) {
    const haptic = useHapticFeedback();
    return (
      <motion.button
        ref={ref}
        type="button"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className={cn(
          "fixed z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground",
          "shadow-xl shadow-primary/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "right-5 bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)]",
          className,
        )}
        onClick={(e) => {
          haptic("light");
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </motion.button>
    );
  },
);
