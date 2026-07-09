import type { ID, Timestamp } from "./common";

/**
 * Generische Diagramm-Datenstrukturen (Teil 10). Konkrete Renderer werden
 * über die ChartRegistry aufgelöst.
 */
export type ChartKind =
  | "line"
  | "bar"
  | "area"
  | "pie"
  | "donut"
  | "heatmap";

export interface ChartPoint {
  x: number | string | Timestamp;
  y: number;
  meta?: Record<string, unknown>;
}

export interface ChartSeries {
  id: ID;
  label: string;
  color?: string;
  points: ChartPoint[];
}

export interface ChartDescriptor {
  id: ID;
  kind: ChartKind;
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  series: ChartSeries[];
  meta?: Record<string, unknown>;
}
