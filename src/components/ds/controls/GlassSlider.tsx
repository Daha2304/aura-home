import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  "aria-label"?: string;
}

export const GlassSlider = forwardRef<HTMLInputElement, GlassSliderProps>(
  function GlassSlider(
    { value, onChange, min = 0, max = 100, step = 1, label, className, ...rest },
    ref,
  ) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{label}</span>
            <span>{value}</span>
          </div>
        )}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={rest["aria-label"] ?? label}
          className="w-full accent-[color:var(--primary)]"
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, color-mix(in oklab, var(--foreground) 15%, transparent) ${pct}%, color-mix(in oklab, var(--foreground) 15%, transparent) 100%)`,
            height: 6,
            borderRadius: 9999,
            appearance: "none",
            WebkitAppearance: "none",
          }}
        />
      </div>
    );
  },
);
