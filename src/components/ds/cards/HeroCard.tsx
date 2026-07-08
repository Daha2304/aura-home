import { motion } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { heroTransition } from "@/themes/motion";

export interface HeroCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  accent?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  layoutId?: string;
}

export const HeroCard = forwardRef<HTMLDivElement, HeroCardProps>(function HeroCard(
  { title, subtitle, image, accent, icon, actions, children, className, layoutId },
  ref,
) {
  return (
    <motion.section
      ref={ref}
      layoutId={layoutId}
      variants={heroTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "glass-card hairline relative isolate overflow-hidden p-6",
        "min-h-[180px]",
        className,
      )}
      style={
        accent
          ? ({ "--accent": accent } as React.CSSProperties)
          : undefined
      }
    >
      {image && (
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage: `linear-gradient(180deg, transparent 20%, color-mix(in oklab, var(--accent, var(--primary)) 30%, transparent) 100%), url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      )}
      {!image && (
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(120% 100% at 0% 0%, color-mix(in oklab, var(--accent, var(--primary)) 55%, transparent), transparent 65%)",
          }}
          aria-hidden
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {icon && (
            <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-2xl bg-white/25 text-foreground backdrop-blur-sm">
              {icon}
            </div>
          )}
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.section>
  );
});
