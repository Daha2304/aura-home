import type { WidgetInstance } from "@/models/widgetInstance";
import type { WidgetDescriptor } from "@/models/widgetDescriptor";
import { cn } from "@/lib/utils";

interface Props {
  widget: WidgetInstance;
  descriptor: WidgetDescriptor | undefined;
}

export function PlaceholderTile({ widget, descriptor }: Props) {
  const label = widget.title || descriptor?.name || widget.widgetType;
  const subtitle = widget.subtitle ?? descriptor?.description;
  const color = widget.styling.color;
  const blur = widget.styling.blur;
  const opacity = widget.styling.opacity ?? 1;
  const radius = widget.styling.borderRadius ?? 22;
  const padding = widget.styling.padding ?? 16;

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden",
        "glass-panel hairline",
      )}
      style={{
        borderRadius: radius,
        padding,
        opacity,
        backdropFilter: blur ? `blur(${blur}px) saturate(140%)` : undefined,
        background: color
          ? `linear-gradient(135deg, ${color}30, ${color}12)`
          : undefined,
        boxShadow:
          widget.styling.shadow === "xl"
            ? "0 30px 80px -20px rgba(0,0,0,0.35)"
            : widget.styling.shadow === "lg"
            ? "0 20px 50px -20px rgba(0,0,0,0.3)"
            : widget.styling.shadow === "md"
            ? "0 12px 30px -12px rgba(0,0,0,0.25)"
            : widget.styling.shadow === "sm"
            ? "0 4px 12px -6px rgba(0,0,0,0.2)"
            : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {descriptor?.icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(var(--foreground)/0.08)]">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{descriptor.icon.slice(0, 2)}</span>
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{label}</div>
          {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
        {descriptor?.category ?? "widget"}
      </div>
    </div>
  );
}
