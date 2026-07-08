import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Trash2, Pause, Play, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDevLogStore, type DevLogEntry, type DevLogKind } from "@/store/slices/devLogStore";
import { buildServerUrl } from "@/models/server";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/developer")({
  component: DeveloperSettings,
});

const KIND_LABEL: Record<DevLogKind, string> = {
  connect: "CONNECT",
  open: "OPEN",
  close: "CLOSE",
  error: "ERROR",
  auth: "AUTH",
  auth_failed: "AUTH!",
  reconnect: "RECON",
  heartbeat: "HB",
  ping: "PING",
  pong: "PONG",
  send: "SEND",
  recv: "RECV",
  info: "INFO",
};

const KIND_COLOR: Record<DevLogKind, string> = {
  connect: "text-sky-300",
  open: "text-emerald-300",
  close: "text-amber-300",
  error: "text-red-400",
  auth: "text-emerald-300",
  auth_failed: "text-red-400",
  reconnect: "text-amber-300",
  heartbeat: "text-muted-foreground",
  ping: "text-muted-foreground",
  pong: "text-muted-foreground",
  send: "text-blue-300",
  recv: "text-fuchsia-300",
  info: "text-muted-foreground",
};

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
}

function DeveloperSettings() {
  const developerMode = useSettingsStore((s) => s.developerMode);
  const setDeveloperMode = useSettingsStore((s) => s.setDeveloperMode);
  const debugWs = useSettingsStore((s) => s.debugWebSocket);
  const setDebugWs = useSettingsStore((s) => s.setDebugWebSocket);
  const activeServer = useSettingsStore((s) =>
    s.servers.find((x) => x.id === s.activeServerId),
  );

  const status = useConnectionStore((s) => s.status);
  const latency = useConnectionStore((s) => s.latencyMs);
  const reconnectAttempt = useConnectionStore((s) => s.reconnectAttempt);
  const lastError = useConnectionStore((s) => s.lastError);
  const authenticated = useConnectionStore((s) => s.authenticated);

  const entries = useDevLogStore((s) => s.entries);
  const paused = useDevLogStore((s) => s.paused);
  const setPaused = useDevLogStore((s) => s.setPaused);
  const clear = useDevLogStore((s) => s.clear);

  const url = activeServer ? buildServerUrl(activeServer) : "—";

  const lastClose = useMemo(
    () => [...entries].reverse().find((e) => e.kind === "close"),
    [entries],
  );
  const lastErrorEntry = useMemo(
    () => [...entries].reverse().find((e) => e.kind === "error" || e.kind === "auth_failed"),
    [entries],
  );
  const lastReconnect = useMemo(
    () => [...entries].reverse().find((e) => e.kind === "reconnect"),
    [entries],
  );

  const view: DevLogEntry[] = useMemo(
    () => entries.slice(-200).reverse(),
    [entries],
  );

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Entwickler" />

      <GlassPanel className="mb-3">
        <label className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">Entwicklermodus</div>
            <div className="text-xs text-muted-foreground">
              Diagnose-Panels und rohe WS-Events
            </div>
          </div>
          <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
        </label>
        <label className="mt-3 flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">WebSocket Debug-Log</div>
            <div className="text-xs text-muted-foreground">
              Ausführliches Logging aller Nachrichten
            </div>
          </div>
          <Switch checked={debugWs} onCheckedChange={setDebugWs} />
        </label>
      </GlassPanel>

      <GlassPanel className="mb-3">
        <div className="text-sm font-semibold">Verbindung</div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium capitalize">{status}</dd>
          <dt className="text-muted-foreground">Authentifiziert</dt>
          <dd className="font-medium">{authenticated ? "ja" : "nein"}</dd>
          <dt className="text-muted-foreground">Ziel-URL</dt>
          <dd className="truncate font-mono">{url}</dd>
          <dt className="text-muted-foreground">Latenz</dt>
          <dd className="font-medium">{latency != null ? `${latency} ms` : "—"}</dd>
          <dt className="text-muted-foreground">Reconnects</dt>
          <dd className="font-medium">{reconnectAttempt}</dd>
          <dt className="text-muted-foreground">Aktueller Backoff</dt>
          <dd className="font-medium">{lastReconnect?.message ?? "—"}</dd>
          <dt className="text-muted-foreground">Letzter Close</dt>
          <dd className="font-medium">
            {lastClose ? `${lastClose.message}${lastClose.detail ? ` · ${lastClose.detail}` : ""}` : "—"}
          </dd>
        </dl>
      </GlassPanel>

      {(lastError || lastErrorEntry) && (
        <GlassPanel className="mb-3 border border-red-500/40 bg-red-500/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-300">
                Letzter Fehler
              </div>
              <div className="mt-1 text-sm font-medium break-words">
                {lastErrorEntry?.message ?? lastError}
              </div>
              {lastErrorEntry?.detail && (
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-black/40 p-2 font-mono text-[11px] text-red-100">
                  {lastErrorEntry.detail}
                </pre>
              )}
              {lastClose && (
                <div className="mt-2 text-xs text-red-200">
                  Close-Code: <span className="font-mono">{lastClose.message}</span>
                  {lastClose.detail ? ` · Reason: ${lastClose.detail}` : ""}
                </div>
              )}
            </div>
          </div>
        </GlassPanel>
      )}

      <GlassPanel>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">
            Live-Protokoll{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({entries.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused(!paused)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? "Fortsetzen" : "Pause"}
            </button>
            <button
              onClick={clear}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
            >
              <Trash2 className="h-3 w-3" /> Leeren
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto rounded-md bg-black/30 p-2 font-mono text-[11px] leading-relaxed">
          {view.length === 0 ? (
            <div className="p-2 text-muted-foreground">Noch keine Ereignisse.</div>
          ) : (
            view.map((e) => (
              <div key={e.id} className="border-b border-white/5 py-1 last:border-b-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">{fmtTime(e.ts)}</span>
                  <span className={cn("w-14 shrink-0 font-semibold", KIND_COLOR[e.kind])}>
                    {KIND_LABEL[e.kind]}
                  </span>
                  <span className="break-words">{e.message}</span>
                </div>
                {e.detail && (
                  <div className="ml-[calc(4rem+3.5rem)] mt-0.5 whitespace-pre-wrap break-all text-muted-foreground/80">
                    {e.detail}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </GlassPanel>
    </>
  );
}
