import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { Dashboard } from "@/models/dashboard";
import { useDashboardEditor } from "@/hooks/useDashboardEditor";
import { useEditorKeyboard } from "@/hooks/useEditorKeyboard";
import { useEditorStore } from "@/store/slices/editorStore";
import { GridBackground } from "./GridBackground";
import { GuidesOverlay } from "./GuidesOverlay";
import { WidgetFrame } from "./WidgetFrame";
import { EmptyDashboardHint } from "./EmptyDashboardHint";

interface Props {
  dashboard: Dashboard;
}

/**
 * Canvas für das aktive Dashboard. Verwaltet Zoom, Grid-Rendering,
 * Widget-Positionierung und Overlays.
 */
export function DashboardCanvas({ dashboard }: Props) {
  const editor = useDashboardEditor(dashboard.id);
  useEditorKeyboard(dashboard.id);
  const zoom = useEditorStore((s) => s.zoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const guides = useEditorStore((s) => s.activeGuides);
  const mode = useEditorStore((s) => s.mode);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState(80);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !editor.grid) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      setCellWidth(w / editor.grid!.columns);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [editor.grid]);

  const grid = editor.grid;
  if (!grid) return null;

  const maxRow = editor.widgets.reduce((acc, w) => {
    const p = grid.placements[w.id];
    return Math.max(acc, (p?.gridY ?? 0) + (p?.h ?? 2));
  }, 8);
  const height = Math.max(400, maxRow * grid.rowHeight + 200);

  return (
    <div className="relative w-full">
      <div
        className="relative mx-auto origin-top"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top center", width: "100%" }}
      >
        <div
          ref={canvasRef}
          className="relative w-full"
          style={{ height, minHeight: 400 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && mode === "edit") {
              useEditorStore.getState().clearSelection();
            }
          }}
        >
          <GridBackground grid={grid} visible={mode === "edit" && showGrid} contentHeight={height} />
          <AnimatePresence>
            {editor.widgets.map((w) => (
              <WidgetFrame
                key={w.id}
                widget={w}
                placement={grid.placements[w.id]}
                grid={grid}
                cellWidth={cellWidth}
              />
            ))}
          </AnimatePresence>
          <GuidesOverlay
            guides={guides}
            cellWidth={cellWidth}
            cellHeight={grid.rowHeight}
            width={cellWidth * grid.columns}
            height={height}
          />
          {editor.widgets.length === 0 && mode === "edit" && <EmptyDashboardHint />}
        </div>
      </div>
    </div>
  );
}
