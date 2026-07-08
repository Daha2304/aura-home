import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  large?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  trailing,
  large = true,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "flex items-end justify-between gap-4 px-1 pt-2 pb-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "truncate font-bold tracking-tight text-foreground",
            large ? "text-[34px] leading-[1.05]" : "text-[22px]",
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
    </header>
  );
}
