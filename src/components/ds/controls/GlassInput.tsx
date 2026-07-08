import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput({ className, label, hint, error, id, ...rest }, ref) {
    const inputId = id ?? `gi-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <label htmlFor={inputId} className="block space-y-1.5">
        {label && (
          <span className="block text-[13px] font-medium text-foreground">{label}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          className={cn(
            "glass-panel hairline block w-full !py-3 !px-4 text-[15px]",
            "bg-white/40 dark:bg-white/5",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "placeholder:text-muted-foreground",
            error && "ring-2 ring-destructive/60",
            className,
          )}
          {...rest}
        />
        {(hint || error) && (
          <span
            className={cn(
              "block text-xs",
              error ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {error ?? hint}
          </span>
        )}
      </label>
    );
  },
);
