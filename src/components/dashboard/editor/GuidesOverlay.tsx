import type { Guide } from "@/services/dashboards/editor/Guides";

interface Props {
  guides: Guide[];
  cellWidth: number;
  cellHeight: number;
  height: number;
  width: number;
}

export function GuidesOverlay({ guides, cellWidth, cellHeight, height, width }: Props) {
  if (guides.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {guides.map((g, i) => {
        if (g.axis === "x") {
          return (
            <div
              key={i}
              className="absolute top-0 h-full w-px bg-[hsl(var(--primary)/0.7)] shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
              style={{ left: g.position * cellWidth, height }}
            />
          );
        }
        return (
          <div
            key={i}
            className="absolute left-0 h-px w-full bg-[hsl(var(--primary)/0.7)] shadow-[0_0_6px_hsl(var(--primary)/0.6)]"
            style={{ top: g.position * cellHeight, width }}
          />
        );
      })}
    </div>
  );
}
