import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { flags, useFlagsStore, listFlags } from "@/services/flags/FeatureFlags";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_app/settings/performance")({
  head: () => ({ meta: [{ title: "Performance · Einstellungen" }] }),
  component: PerformancePage,
});

function PerformancePage() {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState<number | null>(null);
  const framesRef = useRef(0);
  const lastRef = useRef(performance.now());
  const values = useFlagsStore((s) => s.values);
  const perfFlags = listFlags().filter((f) => f.category === "perf");

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
        const mem = (performance as unknown as {
          memory?: { usedJSHeapSize: number };
        }).memory?.usedJSHeapSize;
        if (typeof mem === "number") setMemory(mem);
      }
      if (!stopped) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const tone = fps >= 50 ? "text-emerald-400" : fps >= 30 ? "text-amber-400" : "text-red-400";

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Performance" />

      <GlassPanel className="mb-3">
        <div className="flex items-center gap-3">
          <Activity className={`h-5 w-5 ${tone}`} />
          <div>
            <div className="text-2xl font-semibold">{fps} FPS</div>
            {memory != null && (
              <div className="text-xs text-muted-foreground">
                Heap: {(memory / 1024 / 1024).toFixed(1)} MB
              </div>
            )}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="mb-2 text-sm font-semibold">Performance-Flags</div>
        <div className="space-y-2">
          {perfFlags.map((f) => {
            const current = (values[f.key] ?? f.defaultValue) as boolean;
            return (
              <label
                key={f.key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium">{f.label}</div>
                  {f.description && (
                    <div className="text-xs text-muted-foreground">
                      {f.description}
                    </div>
                  )}
                </div>
                <Switch
                  checked={Boolean(current)}
                  onCheckedChange={(v) => flags.set(f.key, v)}
                  aria-label={f.label}
                />
              </label>
            );
          })}
          {perfFlags.length === 0 && (
            <div className="text-xs text-muted-foreground">Keine Flags.</div>
          )}
        </div>
      </GlassPanel>
    </>
  );
}
