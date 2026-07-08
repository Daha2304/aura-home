import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import type { WidgetInstance } from "@/models/widgetInstance";
import type { LayoutBreakpoint, WidgetPlacement } from "@/models/layout";
import { GlassSurface } from "./glass/GlassSurface";
import { useRuntimeStore } from "@/store/slices/runtimeStore";
import { cn } from "@/lib/utils";

interface RuntimeWidgetHostProps {
  instance: WidgetInstance;
  placement: WidgetPlacement;
  breakpoint: LayoutBreakpoint;
  cellWidth: number;
  cellHeight: number;
  gap: number;
}

/**
 * Rendert eine Widget-Instanz ausschließlich über den Registry-Descriptor.
 * Keine switch/if-Kette — Factory Pattern.
 */
export const RuntimeWidgetHost = memo(function RuntimeWidgetHost({
  instance,
  placement,
  breakpoint,
  cellWidth,
  cellHeight,
  gap,
}: RuntimeWidgetHostProps) {
  const descriptor = widgetRegistry.get(instance.widgetType);
  const theme = useRuntimeStore((s) => s.effectiveTheme);

  const size = useMemo(
    () => ({
      width: placement.w * cellWidth + (placement.w - 1) * gap,
      height: placement.h * cellHeight + (placement.h - 1) * gap,
    }),
    [placement.w, placement.h, cellWidth, cellHeight, gap],
  );

  const content = useMemo(() => {
    if (!descriptor) return <MissingRenderer type={instance.widgetType} />;
    if (!descriptor.render) return <MissingRenderer type={instance.widgetType} name={descriptor.name} />;
    return descriptor.render({ instance, descriptor, breakpoint, placement, size, theme });
  }, [descriptor, instance, breakpoint, placement, size, theme]);

  const style = useMemo(
    () => ({
      gridColumn: `${placement.gridX + 1} / span ${placement.w}`,
      gridRow: `${placement.gridY + 1} / span ${placement.h}`,
      zIndex: (instance.layer ?? 0) + (placement.zIndex ?? 0),
      // Vorbereitung Virtualisierung: nur sichtbare Widgets voll rendern.
      contentVisibility: "auto" as const,
      containIntrinsicSize: `${size.height}px ${size.width}px`,
    }),
    [placement, instance.layer, size],
  );

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: instance.styling.opacity ?? 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative")}
    >
      <GlassSurface
        variant={instance.styling.theme === "glass" ? "liquid" : "frosted"}
        radius="xl"
        className="h-full w-full"
        style={{
          padding: instance.styling.padding,
          backdropFilter: instance.styling.blur ? `blur(${instance.styling.blur}px) saturate(180%)` : undefined,
        }}
      >
        {content}
      </GlassSurface>
    </motion.div>
  );
});

function MissingRenderer({ type, name }: { type: string; name?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-3 text-center">
      <div className="text-xs font-medium text-muted-foreground">{name ?? "Widget"}</div>
      <div className="text-[10px] text-muted-foreground/70">{type}</div>
    </div>
  );
}
