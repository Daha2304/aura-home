import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GlassVariant = "frosted" | "liquid" | "frost";

interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  radius?: "md" | "lg" | "xl" | "2xl" | "3xl";
  elevated?: boolean;
  children?: ReactNode;
}

const radiusMap: Record<NonNullable<GlassSurfaceProps["radius"]>, string> = {
  md: "rounded-2xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[2rem]",
  "3xl": "rounded-[2.5rem]",
};

const variantMap: Record<GlassVariant, string> = {
  frosted:
    "bg-surface/70 backdrop-blur-xl border border-glass-border/60 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.35)]",
  liquid:
    "bg-gradient-to-br from-surface/80 via-surface/60 to-surface/40 backdrop-blur-2xl border border-glass-border/50 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.45)]",
  frost:
    "bg-surface-elevated/80 backdrop-blur-xl border border-glass-highlight/50 shadow-[0_8px_30px_-15px_rgba(0,0,0,0.3)]",
};

export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(function GlassSurface(
  { variant = "frosted", radius = "xl", elevated, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative isolate overflow-hidden",
        variantMap[variant],
        radiusMap[radius],
        elevated && "shadow-[0_30px_80px_-25px_rgba(0,0,0,0.55)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
        "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_40%)]",
        "before:mix-blend-overlay",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
