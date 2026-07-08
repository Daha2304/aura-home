import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  trailing?: ReactNode;
  bare?: boolean;
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard({ title, description, trailing, bare, className, children, ...rest }, ref) {
    return (
      <section
        ref={ref}
        className={cn(
          !bare && "glass-panel hairline p-4",
          "flex flex-col gap-3",
          className,
        )}
        {...rest}
      >
        {(title || trailing) && (
          <header className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {title && (
                <h2 className="truncate text-base font-semibold tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
          </header>
        )}
        {children}
      </section>
    );
  },
);
