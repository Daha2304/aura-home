import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, CloudOff, CloudCheck, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { useOfflineStore } from "@/store/slices/offlineStore";
import { backgroundSync } from "@/services/offline";

export const Route = createFileRoute("/_app/settings/offline")({
  head: () => ({ meta: [{ title: "Offline · Einstellungen" }] }),
  component: OfflineSettings,
});

function OfflineSettings() {
  const online = useOfflineStore((s) => s.online);
  const pending = useOfflineStore((s) => s.pendingCount);
  const syncing = useOfflineStore((s) => s.syncing);
  const lastSync = useOfflineStore((s) => s.lastSyncAt);
  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Offline" subtitle="Verbindung, Synchronisation, Queue" />
      <GlassPanel className="space-y-3" aria-live="polite">
        <div className="flex items-center gap-3">
          {online ? (
            <CloudCheck className="h-5 w-5 text-emerald-400" aria-hidden />
          ) : (
            <CloudOff className="h-5 w-5 text-amber-400" aria-hidden />
          )}
          <div>
            <div className="text-sm font-semibold">{online ? "Online" : "Offline"}</div>
            <div className="text-xs text-muted-foreground">
              {online
                ? "Kommandos werden direkt gesendet."
                : "Kommandos werden lokal gepuffert und nach Reconnect ausgeführt."}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div>
            <div className="text-sm font-semibold">Offene Kommandos</div>
            <div className="text-xs text-muted-foreground">
              {pending} in der Warteschlange
              {lastSync ? ` · zuletzt ${new Date(lastSync).toLocaleTimeString()}` : ""}
            </div>
          </div>
          <GlassButton
            variant="primary"
            size="md"
            onClick={() => void backgroundSync.triggerNow()}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Sync läuft" : "Jetzt synchronisieren"}
          </GlassButton>
        </div>
      </GlassPanel>
    </>
  );
}
