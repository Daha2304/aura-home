import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LayoutGrid, WidgetPlacement } from "@/models/layout";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { editorHistory } from "@/services/dashboards/editor/HistoryStack";
import { computeGuides } from "@/services/dashboards/editor/Guides";
import { useEditorStore } from "@/store/slices/editorStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";

interface Options {
  widgetId: string;
  dashboardId: string;
  grid: LayoutGrid | undefined;
  placement: WidgetPlacement;
  cellWidth: number; // px pro Grid-Zelle X
  cellHeight: number; // px pro Grid-Zelle Y
  disabled?: boolean;
}

/**
 * Pointer-basiertes Widget-Dragging mit rAF-Throttling.
 * Committet erst am pointerup einen History-Command.
 */
export function useDragWidget(opts: Options) {
  const raf = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number; base: WidgetPlacement } | null>(null);
  const pending = useRef<WidgetPlacement | null>(null);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (opts.disabled) return;
    if (useEditorStore.getState().mode !== "edit") return;
    if ((e.target as HTMLElement).closest("[data-resize-handle]")) return;
    e.preventDefault();
    elRef.current = e.currentTarget;
    elRef.current.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, base: opts.placement };
    useEditorStore.getState().setDragging(opts.widgetId);
    useEditorStore.getState().select(opts.widgetId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current || !opts.grid) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    const nextX = start.current.base.gridX + dx / opts.cellWidth;
    const nextY = start.current.base.gridY + dy / opts.cellHeight;

    const snap = useEditorStore.getState().snap;
    const target: WidgetPlacement = {
      ...start.current.base,
      gridX: snap ? Math.round(nextX) : nextX,
      gridY: snap ? Math.round(nextY) : nextY,
    };

    let next = target;
    if (useEditorStore.getState().showGuides && snap) {
      const g = computeGuides(opts.grid, opts.widgetId, target);
      next = g.placement;
      useEditorStore.getState().setGuides(g.guides);
    }
    // clamp
    next = {
      ...next,
      gridX: Math.max(0, Math.min(opts.grid.columns - next.w, next.gridX)),
      gridY: Math.max(0, next.gridY),
    };

    pending.current = next;
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      if (!pending.current) return;
      useLayoutsStore
        .getState()
        .setPlacement(opts.dashboardId, opts.grid!.breakpoint, opts.widgetId, pending.current);
    });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current || !opts.grid) return;
    elRef.current?.releasePointerCapture(e.pointerId);
    const base = start.current.base;
    const final = pending.current ?? base;
    pending.current = null;
    start.current = null;
    useEditorStore.getState().setDragging(null);
    useEditorStore.getState().setGuides([]);
    const bp = opts.grid.breakpoint;
    const dashboardId = opts.dashboardId;
    const widgetId = opts.widgetId;

    if (final.gridX !== base.gridX || final.gridY !== base.gridY) {
      editorHistory.push({
        kind: "move",
        label: "Widget verschieben",
        coalesceKey: `move-${widgetId}`,
        do: () => widgetManager.move(widgetId, bp, final),
        undo: () => widgetManager.move(widgetId, bp, base),
      });
      widgetManager.move(widgetId, bp, final);
    }
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
