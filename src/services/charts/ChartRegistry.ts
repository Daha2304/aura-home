import type { ChartKind, ChartDescriptor } from "@/models/chart";

export interface ChartRendererDescriptor {
  kind: ChartKind;
  label: string;
  icon: string;
  /** Optionaler React-Renderer wird von der UI aufgelöst. */
  render?: (chart: ChartDescriptor) => unknown;
}

class ChartRegistry {
  private readonly map = new Map<ChartKind, ChartRendererDescriptor>();

  register(descriptor: ChartRendererDescriptor): void {
    this.map.set(descriptor.kind, descriptor);
  }

  get(kind: ChartKind): ChartRendererDescriptor | undefined {
    return this.map.get(kind);
  }

  list(): ChartRendererDescriptor[] {
    return Array.from(this.map.values());
  }
}

export const chartRegistry = new ChartRegistry();

// Standard-Deskriptoren (keine Renderer — die UI liefert diese später).
const BUILTINS: ChartRendererDescriptor[] = [
  { kind: "line", label: "Linie", icon: "line-chart" },
  { kind: "bar", label: "Balken", icon: "bar-chart-3" },
  { kind: "area", label: "Fläche", icon: "area-chart" },
  { kind: "pie", label: "Kreis", icon: "pie-chart" },
  { kind: "donut", label: "Donut", icon: "circle-dot" },
  { kind: "heatmap", label: "Heatmap", icon: "grid-3x3" },
];

let registered = false;
export function registerBuiltinChartTypes(): void {
  if (registered) return;
  registered = true;
  for (const d of BUILTINS) chartRegistry.register(d);
}
