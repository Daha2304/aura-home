import { useEditorStore, type ZoomLevel } from "@/store/slices/editorStore";
import { ZoomIn, ZoomOut } from "lucide-react";

const STEPS: ZoomLevel[] = [0.5, 0.75, 1, 1.25, 1.5];

export function ZoomControl() {
  const zoom = useEditorStore((s) => s.zoom);
  const set = useEditorStore((s) => s.setZoom);
  const idx = STEPS.indexOf(zoom);
  const dec = () => set(STEPS[Math.max(0, idx - 1)]);
  const inc = () => set(STEPS[Math.min(STEPS.length - 1, idx + 1)]);
  return (
    <div className="glass-panel hairline flex items-center !rounded-full !p-1">
      <button
        onClick={dec}
        aria-label="Kleiner"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[hsl(var(--foreground)/0.06)]"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="px-2 text-xs tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={inc}
        aria-label="Größer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[hsl(var(--foreground)/0.06)]"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
    </div>
  );
}
