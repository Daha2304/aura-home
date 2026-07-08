import { useMemo, useRef, useEffect, useState } from "react";
import type { Dashboard } from "@/models/dashboard";
import { DEFAULT_GRID_BY_BREAKPOINT } from "@/models/layout";
import { useRuntimeDashboard } from "@/hooks/runtime/useRuntimeDashboard";
import { RuntimeWidgetHost } from "./RuntimeWidgetHost";
import { RuntimeEmptyState } from "./RuntimeEmptyState";

interface RuntimeCanvasProps {
  dashboard: Dashboard;
}

/**
 * Read-only Grid-Renderer, exakt dieselbe Grid-Mathematik wie im Editor,
 * aber ohne Drag/Resize/Selection.
 */
export function RuntimeCanvas({ dashboard }: RuntimeCanvasProps) {
  const { widgets, breakpoint, grid } = useRuntimeDashboard(dashboard.id);

  const cfg = grid ?? {
    columns: DEFAULT_GRID_BY_BREAKPOINT[breakpoint].columns,
    rowHeight: DEFAULT_GRID_BY_BREAKPOINT[breakpoint].rowHeight,
    gap: DEFAULT_GRID_BY_BREAKPOINT[breakpoint].gap,
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const cellWidth = useMemo(() => {
    if (!width) return 0;
    return (width - cfg.gap * (cfg.columns - 1)) / cfg.columns;
  }, [width, cfg.gap, cfg.columns]);

  if (widgets.length === 0) {
    return <RuntimeEmptyState dashboardId={dashboard.id} />;
  }

  return (
    <div
      ref={containerRef}
      className="grid w-full"
      style={{
        gridTemplateColumns: `repeat(${cfg.columns}, minmax(0, 1fr))`,
        gridAutoRows: `${cfg.rowHeight}px`,
        gap: `${cfg.gap}px`,
      }}
    >
      {widgets.map(({ instance, placement }) => (
        <RuntimeWidgetHost
          key={instance.id}
          instance={instance}
          placement={placement}
          breakpoint={breakpoint}
          cellWidth={cellWidth}
          cellHeight={cfg.rowHeight}
          gap={cfg.gap}
        />
      ))}
    </div>
  );
}
