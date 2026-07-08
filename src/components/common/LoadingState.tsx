import { GlassPanel } from "@/components/glass/GlassPanel";
import { cn } from "@/lib/utils";

interface Props {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 3, className }: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <GlassPanel key={i} className="h-20 animate-pulse !p-0" />
      ))}
    </div>
  );
}
