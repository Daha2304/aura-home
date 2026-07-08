import type { LayoutGrid, WidgetPlacement } from "@/models/layout";

export interface Guide {
  axis: "x" | "y";
  position: number; // in Grid-Units
}

const SNAP_THRESHOLD = 0.5; // Grid-Einheiten

/**
 * Berechnet magnetische Hilfslinien zu Nachbarn und snappt eine Ziel-Placement
 * auf die nächstgelegene Kante.
 */
export function computeGuides(
  grid: LayoutGrid,
  self: string,
  target: WidgetPlacement,
): { placement: WidgetPlacement; guides: Guide[] } {
  const guides: Guide[] = [];
  let x = target.gridX;
  let y = target.gridY;

  for (const [id, p] of Object.entries(grid.placements)) {
    if (id === self) continue;
    const xs = [p.gridX, p.gridX + p.w];
    const ys = [p.gridY, p.gridY + p.h];
    const selfXs = [x, x + target.w];
    const selfYs = [y, y + target.h];
    for (const sx of selfXs) {
      for (const nx of xs) {
        if (Math.abs(sx - nx) <= SNAP_THRESHOLD) {
          x += nx - sx;
          guides.push({ axis: "x", position: nx });
        }
      }
    }
    for (const sy of selfYs) {
      for (const ny of ys) {
        if (Math.abs(sy - ny) <= SNAP_THRESHOLD) {
          y += ny - sy;
          guides.push({ axis: "y", position: ny });
        }
      }
    }
  }

  // Ränder
  if (Math.abs(x) <= SNAP_THRESHOLD) { guides.push({ axis: "x", position: 0 }); x = 0; }
  const right = grid.columns;
  if (Math.abs(x + target.w - right) <= SNAP_THRESHOLD) {
    guides.push({ axis: "x", position: right });
    x = right - target.w;
  }

  return { placement: { ...target, gridX: x, gridY: y }, guides };
}
