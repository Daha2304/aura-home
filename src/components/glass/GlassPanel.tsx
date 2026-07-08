import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const GlassPanel = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function GlassPanel({ className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("glass-panel hairline p-4", className)}
      {...rest}
    />
  );
});
