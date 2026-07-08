import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({ children, action, className }: Props) {
  return (
    <div className={cn("flex items-end justify-between px-1", className)}>
      <h2 className="text-[15px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}
