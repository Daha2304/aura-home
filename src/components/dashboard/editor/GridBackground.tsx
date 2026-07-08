import type { LayoutGrid } from "@/models/layout";

interface Props {
  grid: LayoutGrid;
  visible: boolean;
  contentHeight: number;
}

export function GridBackground({ grid, visible, contentHeight }: Props) {
  if (!visible) return null;
  const cols = grid.columns;
  const stroke = "hsl(var(--foreground) / 0.06)";
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${cols} ${Math.max(1, Math.ceil(contentHeight / grid.rowHeight))}`}
    >
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <line key={`v${i}`} x1={i} y1={0} x2={i} y2={999} stroke={stroke} strokeWidth={0.02} />
      ))}
      {Array.from({ length: Math.max(1, Math.ceil(contentHeight / grid.rowHeight)) + 1 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i} x2={cols} y2={i} stroke={stroke} strokeWidth={0.02} />
      ))}
    </svg>
  );
}
