/**
 * Diagnostics-Widgets — system.healthStatus, system.buildInfo, system.performance,
 * system.diagnostics. Registriert ausschließlich über die Widget Registry.
 */
import { useEffect, useRef, useState } from "react";
import { Activity, HeartPulse, Info, GaugeCircle } from "lucide-react";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import type { LayoutBreakpoint } from "@/models/layout";
import { useHealthStore, healthManager } from "@/services/health";
import { buildInfo } from "@/generated/buildInfo";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";

const ALL_LAYOUTS: LayoutBreakpoint[] = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
];

function Tile({
  icon: Icon,
  title,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "ok" | "fail";
}) {
  const toneCls =
    tone === "warn"
      ? "text-amber-400"
      : tone === "ok"
        ? "text-emerald-400"
        : tone === "fail"
          ? "text-red-400"
          : "text-accent";
  return (
    <div className="flex h-full w-full flex-col justify-between p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-4 w-4 ${toneCls}`} />
        <span>{title}</span>
      </div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
      {hint ? <div className="truncate text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function HealthStatusWidget() {
  useEffect(() => {
    void healthManager.runAll();
  }, []);
  const reports = useHealthStore((s) => s.reports);
  const failing = reports.filter((r) => r.result.status === "fail").length;
  const warning = reports.filter((r) => r.result.status === "warn").length;
  const tone = failing > 0 ? "fail" : warning > 0 ? "warn" : "ok";
  const value =
    failing > 0
      ? `${failing} Fehler`
      : warning > 0
        ? `${warning} Warnungen`
        : "Alles OK";
  return (
    <Tile
      icon={HeartPulse}
      title="System-Gesundheit"
      value={value}
      hint={`${reports.length} Checks`}
      tone={tone}
    />
  );
}

function BuildInfoWidget() {
  return (
    <Tile
      icon={Info}
      title="Build"
      value={`v${buildInfo.version}`}
      hint={`${buildInfo.mode} · ${buildInfo.hash.slice(0, 7)}`}
    />
  );
}

function DiagnosticsWidget() {
  const status = useConnectionStore((s) => s.status);
  const widgetsCount = useWidgetRegistryStore((s) => s.descriptors.length);
  return (
    <Tile
      icon={GaugeCircle}
      title="Diagnose"
      value={status === "connected" ? "Verbunden" : status}
      hint={`${widgetsCount} Widgets registriert`}
      tone={status === "connected" ? "ok" : "warn"}
    />
  );
}

function PerformanceWidget() {
  const [fps, setFps] = useState(0);
  const framesRef = useRef(0);
  const lastRef = useRef(performance.now());
  useEffect(() => {
    let raf = 0;
    let stopped = false;
    const loop = () => {
      framesRef.current++;
      const now = performance.now();
      if (now - lastRef.current >= 1000) {
        setFps(framesRef.current);
        framesRef.current = 0;
        lastRef.current = now;
      }
      if (!stopped) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);
  const tone = fps >= 50 ? "ok" : fps >= 30 ? "warn" : "fail";
  return (
    <Tile
      icon={Activity}
      title="Performance"
      value={`${fps} FPS`}
      hint="Live-Sampling"
      tone={tone}
    />
  );
}

export const DIAGNOSTICS_WIDGET_IDS = [
  "system.healthStatus",
  "system.buildInfo",
  "system.diagnostics",
  "system.performance",
];

let registered = false;
export function registerDiagnosticsWidgets(): void {
  if (registered) return;
  registered = true;
  const common = {
    category: "system" as const,
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: ALL_LAYOUTS,
    settings: [],
    capabilities: ["movable", "resizable"] as const,
    version: 1,
  };
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "system.healthStatus",
      name: "System-Gesundheit",
      description: "Aggregierter Health-Check-Status.",
      icon: "heart-pulse",
      capabilities: [...common.capabilities],
      render: () => <HealthStatusWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "system.buildInfo",
      name: "Build-Info",
      description: "Version, Modus, Hash.",
      icon: "info",
      capabilities: [...common.capabilities],
      render: () => <BuildInfoWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "system.diagnostics",
      name: "Diagnose",
      description: "Kurzstatus der Kernsysteme.",
      icon: "gauge-circle",
      capabilities: [...common.capabilities],
      render: () => <DiagnosticsWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "system.performance",
      name: "Performance",
      description: "Live FPS.",
      icon: "activity",
      capabilities: [...common.capabilities],
      render: () => <PerformanceWidget />,
    }),
  );
}
