import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, RefreshCw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { useUpdateStore } from "@/store/slices/updateStore";
import { updateManager } from "@/services/pwa";

export const Route = createFileRoute("/_app/settings/update")({
  head: () => ({ meta: [{ title: "App-Update · Einstellungen" }] }),
  component: UpdateSettings,
});

function UpdateSettings() {
  const available = useUpdateStore((s) => s.available);
  const applying = useUpdateStore((s) => s.applying);
  const version = useUpdateStore((s) => s.currentVersion);
  const lastChecked = useUpdateStore((s) => s.lastChecked);
  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="App-Update" subtitle="Aktualisierungen verwalten" />
      <GlassPanel className="space-y-3" aria-live="polite">
        <div className="flex items-center gap-3">
          <Sparkles
            className={`h-5 w-5 ${available ? "text-amber-400" : "text-emerald-400"}`}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold">
              {available ? "Update verfügbar" : "App ist aktuell"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              Aktuelle Version: {version ?? "unbekannt"}
              {lastChecked
                ? ` · zuletzt geprüft ${new Date(lastChecked).toLocaleTimeString()}`
                : ""}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <GlassButton
            variant="ghost"
            size="md"
            onClick={() => void updateManager.checkForUpdate()}
          >
            <RefreshCw className="h-4 w-4" /> Nach Updates suchen
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            onClick={() => void updateManager.softReload()}
            disabled={applying}
          >
            Neu laden
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="md"
            onClick={() => void updateManager.hardReload()}
            disabled={applying}
          >
            Caches leeren & neu laden
          </GlassButton>
        </div>
      </GlassPanel>
    </>
  );
}
