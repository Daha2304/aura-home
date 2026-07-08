export function formatTemperature(value: number, unit: "C" | "F" = "C"): string {
  return `${value.toFixed(1)}°${unit}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
  return `${Math.round(watts)} W`;
}

export function formatRelativeTime(ts: number | undefined): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const s = Math.round(diff / 1000);
  if (s < 60) return `vor ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `vor ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `vor ${h}h`;
  const d = Math.round(h / 24);
  return `vor ${d}d`;
}
