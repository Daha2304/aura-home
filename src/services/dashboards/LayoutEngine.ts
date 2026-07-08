import type {
  LayoutBreakpoint,
  LayoutGrid,
  WidgetPlacement,
} from "@/models/layout";
import { ALL_BREAKPOINTS, DEFAULT_GRID_BY_BREAKPOINT, createEmptyLayout } from "@/models/layout";
import type { WidgetDescriptor } from "@/models/widgetDescriptor";

/**
 * Layout Engine — Vorbereitung der Grid-, Snap-, Free- und Responsive-Logik.
 * Reine Utility-Klasse ohne React/DOM-Abhängigkeiten.
 */
export class LayoutEngine {
  ensureLayout(
    layouts: Partial<Record<LayoutBreakpoint, LayoutGrid>>,
    breakpoint: LayoutBreakpoint,
  ): LayoutGrid {
    return layouts[breakpoint] ?? createEmptyLayout(breakpoint);
  }

  /**
   * Auflösung mit Fallback-Kaskade: gefragter Breakpoint → verwandte
   * Breakpoints → erster verfügbarer.
   */
  resolvePlacement(
    placements: Partial<Record<LayoutBreakpoint, WidgetPlacement>>,
    breakpoint: LayoutBreakpoint,
  ): WidgetPlacement | undefined {
    if (placements[breakpoint]) return placements[breakpoint];
    const chain = FALLBACK[breakpoint];
    for (const bp of chain) {
      if (placements[bp]) return placements[bp];
    }
    for (const bp of ALL_BREAKPOINTS) {
      if (placements[bp]) return placements[bp];
    }
    return undefined;
  }

  /** Automatische Größenanpassung an den Grid-Rand. */
  autoFit(size: { w: number; h: number }, grid: LayoutGrid): { w: number; h: number } {
    return {
      w: Math.max(1, Math.min(size.w, grid.columns)),
      h: Math.max(1, size.h),
    };
  }

  /** Sucht die nächste freie Zelle für ein Widget der Größe (w,h). */
  findFreeSlot(grid: LayoutGrid, size: { w: number; h: number }): { gridX: number; gridY: number } {
    const occ = this.occupancy(grid);
    const w = Math.min(size.w, grid.columns);
    let y = 0;
    while (y < 10000) {
      for (let x = 0; x + w <= grid.columns; x++) {
        if (!this.collides(occ, x, y, w, size.h)) return { gridX: x, gridY: y };
      }
      y++;
    }
    return { gridX: 0, gridY: 0 };
  }

  /** Prüft, ob eine Platzierung mit einer anderen kollidiert. */
  hasCollision(grid: LayoutGrid, id: string, p: WidgetPlacement): boolean {
    for (const [otherId, other] of Object.entries(grid.placements)) {
      if (otherId === id) continue;
      if (
        p.gridX < other.gridX + other.w &&
        p.gridX + p.w > other.gridX &&
        p.gridY < other.gridY + other.h &&
        p.gridY + p.h > other.gridY
      ) {
        return true;
      }
    }
    return false;
  }

  /** Snap auf Grid-Einheiten (X/Y). */
  snap(p: WidgetPlacement): WidgetPlacement {
    return {
      ...p,
      gridX: Math.max(0, Math.round(p.gridX)),
      gridY: Math.max(0, Math.round(p.gridY)),
      w: Math.max(1, Math.round(p.w)),
      h: Math.max(1, Math.round(p.h)),
    };
  }

  /** Mappt Placements eines Breakpoints auf einen anderen (Responsive). */
  mapPlacementsToBreakpoint(
    source: LayoutGrid,
    targetBreakpoint: LayoutBreakpoint,
  ): LayoutGrid {
    const cfg = DEFAULT_GRID_BY_BREAKPOINT[targetBreakpoint];
    const target = createEmptyLayout(targetBreakpoint, source.mode);
    const ratio = cfg.columns / source.columns;
    for (const [id, p] of Object.entries(source.placements)) {
      target.placements[id] = {
        ...p,
        gridX: Math.min(cfg.columns - 1, Math.floor(p.gridX * ratio)),
        w: Math.max(1, Math.min(cfg.columns, Math.round(p.w * ratio))),
      };
    }
    return target;
  }

  /**
   * Wählt ein Default-Placement für einen neuen Widget-Descriptor auf einem
   * gegebenen Breakpoint.
   */
  defaultPlacementFor(
    grid: LayoutGrid,
    descriptor: WidgetDescriptor,
  ): WidgetPlacement {
    const preset = descriptor.defaultPlacement?.[grid.breakpoint];
    const size = preset
      ? { w: preset.w, h: preset.h }
      : this.autoFit(descriptor.defaultSize, grid);
    const slot = preset
      ? { gridX: preset.gridX, gridY: preset.gridY }
      : this.findFreeSlot(grid, size);
    return {
      gridX: slot.gridX,
      gridY: slot.gridY,
      w: size.w,
      h: size.h,
      zIndex: preset?.zIndex ?? 0,
      rotation: preset?.rotation,
    };
  }

  private occupancy(grid: LayoutGrid): boolean[][] {
    const rows: boolean[][] = [];
    for (const p of Object.values(grid.placements)) {
      for (let y = p.gridY; y < p.gridY + p.h; y++) {
        rows[y] ||= new Array(grid.columns).fill(false);
        for (let x = p.gridX; x < p.gridX + p.w; x++) {
          rows[y][x] = true;
        }
      }
    }
    return rows;
  }

  private collides(occ: boolean[][], x: number, y: number, w: number, h: number): boolean {
    for (let yy = y; yy < y + h; yy++) {
      const row = occ[yy];
      if (!row) continue;
      for (let xx = x; xx < x + w; xx++) {
        if (row[xx]) return true;
      }
    }
    return false;
  }
}

const FALLBACK: Record<LayoutBreakpoint, LayoutBreakpoint[]> = {
  "phone-portrait": ["phone-landscape", "tablet-portrait", "tablet-landscape", "desktop"],
  "phone-landscape": ["phone-portrait", "tablet-landscape", "tablet-portrait", "desktop"],
  "tablet-portrait": ["tablet-landscape", "phone-portrait", "desktop", "phone-landscape"],
  "tablet-landscape": ["tablet-portrait", "desktop", "phone-landscape", "phone-portrait"],
  desktop: ["tablet-landscape", "tablet-portrait", "phone-landscape", "phone-portrait"],
};

export const layoutEngine = new LayoutEngine();
