import { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface GlassSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  "aria-label"?: string;
}

export const GlassSwitch = forwardRef<HTMLButtonElement, GlassSwitchProps>(
  function GlassSwitch({ checked, onChange, disabled, label, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={rest["aria-label"] ?? label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked ? "bg-primary" : "bg-foreground/15",
          disabled && "opacity-50",
          className,
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "grid h-6 w-6 place-items-center rounded-full bg-white shadow",
            "ml-1",
          )}
          style={{ marginLeft: checked ? 28 : 4 }}
        />
      </button>
    );
  },
);
