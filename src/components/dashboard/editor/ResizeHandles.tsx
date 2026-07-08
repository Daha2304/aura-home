import type { PointerEvent as ReactPointerEvent } from "react";
import type { ResizeHandle } from "@/hooks/useResizeWidget";

const HANDLES: { id: ResizeHandle; cls: string; cursor: string }[] = [
  { id: "n", cls: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
  { id: "s", cls: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { id: "e", cls: "top-1/2 right-0 -translate-y-1/2 translate-x-1/2", cursor: "ew-resize" },
  { id: "w", cls: "top-1/2 left-0 -translate-y-1/2 -translate-x-1/2", cursor: "ew-resize" },
  { id: "ne", cls: "top-0 right-0 -translate-y-1/2 translate-x-1/2", cursor: "nesw-resize" },
  { id: "nw", cls: "top-0 left-0 -translate-y-1/2 -translate-x-1/2", cursor: "nwse-resize" },
  { id: "se", cls: "bottom-0 right-0 translate-y-1/2 translate-x-1/2", cursor: "nwse-resize" },
  { id: "sw", cls: "bottom-0 left-0 translate-y-1/2 -translate-x-1/2", cursor: "nesw-resize" },
];

interface Props {
  onBegin: (h: ResizeHandle) => (e: ReactPointerEvent<HTMLElement>) => void;
  onMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onEnd: (e: ReactPointerEvent<HTMLElement>) => void;
}

export function ResizeHandles({ onBegin, onMove, onEnd }: Props) {
  return (
    <>
      {HANDLES.map((h) => (
        <span
          key={h.id}
          data-resize-handle={h.id}
          onPointerDown={onBegin(h.id)}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
          style={{ cursor: h.cursor, touchAction: "none" }}
          className={`absolute z-20 h-8 w-8 ${h.cls} flex items-center justify-center`}
        >
          <span className="h-3 w-3 rounded-full bg-primary shadow-lg ring-2 ring-background" />
        </span>
      ))}
    </>
  );
}
