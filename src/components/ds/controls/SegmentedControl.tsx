import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedControlProps<V extends string> {
  value: V;
  onChange: (v: V) => void;
  options: SegmentedOption<V>[];
  className?: string;
  "aria-label"?: string;
}

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  className,
  ...rest
}: SegmentedControlProps<V>) {
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn(
        "glass-panel hairline relative inline-flex items-center gap-1 !p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 min-h-9 rounded-full px-3 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="segmented-active"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
