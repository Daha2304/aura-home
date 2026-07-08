import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

export interface InfoCardProps {
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const InfoCard = forwardRef<HTMLDivElement, InfoCardProps>(function InfoCard(
  { title, children, icon, className },
  ref,
) {
  return (
    <div ref={ref} className={cn("glass-panel hairline flex gap-3 p-4", className)}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-info/20 text-[color:var(--info)]">
        {icon ?? <Info className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 text-sm">
        {title && <div className="mb-0.5 font-semibold">{title}</div>}
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
});
