import { memo } from "react";
import { motion } from "framer-motion";
import type { WidgetInstance } from "@/models/widgetInstance";
import type { LayoutGrid, WidgetPlacement } from "@/models/layout";
import { useEditorStore } from "@/store/slices/editorStore";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";
import { useDragWidget } from "@/hooks/useDragWidget";
import { useResizeWidget } from "@/hooks/useResizeWidget";
import { useLongPressEdit } from "@/hooks/useLongPressEdit";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { editorClipboard } from "@/services/dashboards/editor/Clipboard";
import { Copy, Trash2 } from "lucide-react";
import { ResizeHandles } from "./ResizeHandles";
import { WidgetRenderer } from "./WidgetRenderer";
import { cn } from "@/lib/utils";
import { springSoft } from "@/themes/motion";

interface Props {
  widget: WidgetInstance;
  placement: WidgetPlacement | undefined;
  grid: LayoutGrid;
  cellWidth: number;
}

function WidgetFrameImpl({ widget, placement, grid, cellWidth }: Props) {
  const mode = useEditorStore((s) => s.mode);
  const selected = useEditorStore((s) => s.selection.has(widget.id));
  const dragging = useEditorStore((s) => s.dragging === widget.id);
  const descriptor = useWidgetRegistryStore((s) => s.byId[widget.widgetType]);

  const p: WidgetPlacement = placement ?? {
    gridX: 0,
    gridY: 0,
    w: descriptor?.defaultSize.w ?? 3,
    h: descriptor?.defaultSize.h ?? 2,
  };

  const cellHeight = grid.rowHeight;
  const dragProps = useDragWidget({
    widgetId: widget.id,
    dashboardId: widget.dashboardId,
    grid,
    placement: p,
    cellWidth,
    cellHeight,
    disabled: mode !== "edit",
  });
  const resize = useResizeWidget({
    widgetId: widget.id,
    dashboardId: widget.dashboardId,
    grid,
    placement: p,
    descriptor,
    cellWidth,
    cellHeight,
  });
  const longPress = useLongPressEdit(widget.id);

  const style: React.CSSProperties = {
    position: "absolute",
    left: p.gridX * cellWidth + grid.gap / 2,
    top: p.gridY * cellHeight + grid.gap / 2,
    width: p.w * cellWidth - grid.gap,
    height: p.h * cellHeight - grid.gap,
    zIndex: (p.zIndex ?? 0) + widget.layer + (selected ? 10 : 0),
    touchAction: mode === "edit" ? "none" : undefined,
    transform: p.rotation ? `rotate(${p.rotation}deg)` : undefined,
  };

  const onClick = () => {
    if (mode === "edit") useEditorStore.getState().select(widget.id);
  };

  return (
    <motion.div
      layout
      transition={springSoft}
      style={style}
      onClick={onClick}
      onPointerDown={mode === "edit" ? dragProps.onPointerDown : longPress.onPointerDown}
      onPointerMove={mode === "edit" ? dragProps.onPointerMove : longPress.onPointerMove}
      onPointerUp={mode === "edit" ? dragProps.onPointerUp : longPress.onPointerUp}
      onPointerCancel={mode === "edit" ? undefined : longPress.onPointerCancel}
      className={cn(
        "group",
        mode === "edit" && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-90",
      )}
    >
      <div className="relative h-full w-full">
        <div
          className={cn(
            "h-full w-full transition-shadow",
            selected && "ring-2 ring-primary rounded-[22px]",
          )}
        >
          <WidgetRenderer widget={widget} />
        </div>
        {mode === "edit" && selected && (
          <>
            <div className="absolute -top-10 left-0 z-30 flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 shadow-lg backdrop-blur">
              <button
                onClick={(e) => { e.stopPropagation(); editorClipboard.duplicate([widget.id]); }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                aria-label="Duplizieren"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); widgetManager.remove(widget.id); useEditorStore.getState().clearSelection(); }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
                aria-label="Löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <ResizeHandles onBegin={resize.begin} onMove={resize.move} onEnd={resize.end} />
          </>
        )}
      </div>
    </motion.div>
  );
}

export const WidgetFrame = memo(WidgetFrameImpl);
