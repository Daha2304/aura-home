import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  function SkeletonCard({ lines = 3, className }, ref) {
    return (
      <div
        ref={ref}
        className={cn("glass-panel hairline space-y-3 p-4", className)}
        aria-hidden
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-foreground/10" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-foreground/10" />
        </div>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded-full bg-foreground/10"
            style={{ width: `${100 - i * 12}%` }}
          />
        ))}
      </div>
    );
  },
);
