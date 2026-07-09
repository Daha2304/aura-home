import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Download, RefreshCw, HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { useHealthStore, healthManager, type HealthStatus } from "@/services/health";
import { useVersionStore } from "@/services/version/VersionManager";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useOfflineStore } from "@/store/slices/offlineStore";
import { useUpdateStore } from "@/store/slices/updateStore";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";
import { buildInfo } from "@/generated/buildInfo";

export const Route = createFileRoute("/_app/settings/diagnostics")({
  head: () => ({ meta: [{ title: "Diagnose · Einstellungen" }] }),
  component: DiagnosticsPage,
});

const STATUS_TONE: Record<HealthStatus, string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-red-400",
  unknown: "text-muted-foreground",
};

function DiagnosticsPage() {
  const reports = useHealthStore((s) => s.reports);
  const running = useHealthStore((s) => s.running);
  const lastRunAt = useHealthStore((s) => s.lastRunAt);
  const version = useVersionStore((s) => s);
  const conn = useConnectionStore((s) => s);
  const online = useOfflineStore((s) => s.online);
  const update = useUpdateStore((s) => s);
  const widgetsCount = useWidgetRegistryStore((s) => s.descriptors.length);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    void healthManager.runAll();
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      void navigator.storage.estimate().then(setStorage);
    }
  }, []);

  const exportJson = () => {
    const snapshot = {
      generatedAt: new Date().toISOString(),
      build: buildInfo,
      version,
      connection: conn,
      offline: { online },
      update,
      health: reports,
      counts: { widgets: widgetsCount },
      storage,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnose-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Link
        to="/settings"
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Diagnose" />

      <GlassPanel className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">System-Gesundheit</div>
            <div className="text-xs text-muted-foreground">
              {lastRunAt ? `zuletzt: ${new Date(lastRunAt).toLocaleTimeString()}` : "noch nicht gelaufen"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void healthManager.runAll()}
              disabled={running}
              aria-label="Health-Checks erneut ausführen"
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
              Aktualisieren
            </button>
            <button
              onClick={exportJson}
              aria-label="Diagnose als JSON exportieren"
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
            >
              <Download className="h-3 w-3" /> Export
            </button>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="mb-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <HeartPulse className="h-4 w-4" /> Checks
        </div>
        <ul className="space-y-1 text-sm">
          {reports.length === 0 && (
            <li className="text-xs text-muted-foreground">Keine Checks ausgeführt.</li>
          )}
          {reports.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-3 border-b border-white/5 py-1 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{r.label}</div>
                {r.result.detail && (
                  <div className="truncate text-xs text-muted-foreground">
                    {r.result.detail}
                  </div>
                )}
              </div>
              <span
                className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${STATUS_TONE[r.result.status]}`}
              >
                {r.result.status}
              </span>
            </li>
          ))}
        </ul>
      </GlassPanel>

      <GlassPanel>
        <div className="text-sm font-semibold">Umgebung</div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Build</dt>
          <dd className="font-mono">v{buildInfo.version} · {buildInfo.mode}</dd>
          <dt className="text-muted-foreground">Hash</dt>
          <dd className="truncate font-mono">{buildInfo.hash}</dd>
          <dt className="text-muted-foreground">Datenmodell</dt>
          <dd className="font-mono">v{version.dataModelVersion}</dd>
          <dt className="text-muted-foreground">Cache-Version</dt>
          <dd className="font-mono">v{version.cacheVersion}</dd>
          <dt className="text-muted-foreground">Backup-Version</dt>
          <dd className="font-mono">v{version.backupVersion}</dd>
          <dt className="text-muted-foreground">Widgets</dt>
          <dd className="font-mono">{widgetsCount}</dd>
          {storage && (
            <>
              <dt className="text-muted-foreground">Speicher</dt>
              <dd className="font-mono">
                {((storage.usage ?? 0) / 1024 / 1024).toFixed(1)} MB /
                {" "}
                {((storage.quota ?? 0) / 1024 / 1024).toFixed(0)} MB
              </dd>
            </>
          )}
        </dl>
      </GlassPanel>
    </>
  );
}
