import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LayoutGrid, WidgetPlacement } from "@/models/layout";
import type { WidgetDescriptor } from "@/models/widgetDescriptor";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { editorHistory } from "@/services/dashboards/editor/HistoryStack";
import { useEditorStore } from "@/store/slices/editorStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Options {
  widgetId: string;
  dashboardId: string;
  grid: LayoutGrid | undefined;
  placement: WidgetPlacement;
  descriptor: WidgetDescriptor | undefined;
  cellWidth: number;
  cellHeight: number;
}

export function useResizeWidget(opts: Options) {
  const start = useRef<{ x: number; y: number; base: WidgetPlacement; handle: ResizeHandle } | null>(null);
  const raf = useRef<number | null>(null);
  const pending = useRef<WidgetPlacement | null>(null);

  const begin = (handle: ResizeHandle) => (e: ReactPointerEvent<HTMLElement>) => {
    if (useEditorStore.getState().mode !== "edit") return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, base: opts.placement, handle };
    useEditorStore.getState().setResizing(opts.widgetId);
    useEditorStore.getState().select(opts.widgetId);
  };

  const move = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current || !opts.grid) return;
    const { base, handle } = start.current;
    const dx = (e.clientX - start.current.x) / opts.cellWidth;
    const dy = (e.clientY - start.current.y) / opts.cellHeight;

    let x = base.gridX;
    let y = base.gridY;
    let w = base.w;
    let h = base.h;

    if (handle.includes("e")) w = base.w + dx;
    if (handle.includes("s")) h = base.h + dy;
    if (handle.includes("w")) { x = base.gridX + dx; w = base.w - dx; }
    if (handle.includes("n")) { y = base.gridY + dy; h = base.h - dy; }

    const snap = useEditorStore.getState().snap;
    if (snap) {
      x = Math.round(x); y = Math.round(y);
      w = Math.round(w); h = Math.round(h);
    }
    const min = opts.descriptor?.minSize ?? { w: 1, h: 1 };
    const max = opts.descriptor?.maxSize ?? { w: opts.grid.columns, h: 999 };
    w = Math.max(min.w, Math.min(max.w, w, opts.grid.columns));
    h = Math.max(min.h, Math.min(max.h, h));
    x = Math.max(0, Math.min(opts.grid.columns - w, x));
    y = Math.max(0, y);

    if (useEditorStore.getState().lockAspect) {
      const ratio = base.w / base.h;
      if (handle === "e" || handle === "w") h = Math.max(min.h, Math.round(w / ratio));
      else if (handle === "n" || handle === "s") w = Math.max(min.w, Math.round(h * ratio));
      else {
        const avg = Math.max(w / base.w, h / base.h);
        w = Math.max(min.w, Math.round(base.w * avg));
        h = Math.max(min.h, Math.round(base.h * avg));
      }
    }

    pending.current = { ...base, gridX: x, gridY: y, w, h };
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      if (!pending.current) return;
      useLayoutsStore
        .getState()
        .setPlacement(opts.dashboardId, opts.grid!.breakpoint, opts.widgetId, pending.current);
    });
  };

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current || !opts.grid) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const base = start.current.base;
    const final = pending.current ?? base;
    pending.current = null;
    start.current = null;
    useEditorStore.getState().setResizing(null);
    const bp = opts.grid.breakpoint;
    const wid = opts.widgetId;

    if (final.w !== base.w || final.h !== base.h || final.gridX !== base.gridX || final.gridY !== base.gridY) {
      editorHistory.push({
        kind: "resize",
        label: "Widget skalieren",
        coalesceKey: `resize-${wid}`,
        do: () => widgetManager.resize(wid, bp, final),
        undo: () => widgetManager.resize(wid, bp, base),
      });
      widgetManager.resize(wid, bp, final);
    }
  };

  return { begin, move, end };
}
