import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingCardProps {
  label?: string;
  className?: string;
}

export const LoadingCard = forwardRef<HTMLDivElement, LoadingCardProps>(
  function LoadingCard({ label = "Wird geladen …", className }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "glass-panel hairline flex items-center justify-center gap-3 p-8 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    );
  },
);
