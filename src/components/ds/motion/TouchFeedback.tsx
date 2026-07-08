import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

export interface TouchFeedbackProps extends HTMLMotionProps<"div"> {
  haptic?: "light" | "medium" | "heavy" | false;
  scale?: number;
}

export const TouchFeedback = forwardRef<HTMLDivElement, TouchFeedbackProps>(
  function TouchFeedback({ haptic = "light", scale = 0.98, onTap, ...rest }, ref) {
    const trigger = useHapticFeedback();
    return (
      <motion.div
        ref={ref}
        whileTap={{ scale }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onTap={(e, info) => {
          if (haptic) trigger(haptic);
          onTap?.(e, info);
        }}
        {...rest}
      />
    );
  },
);
