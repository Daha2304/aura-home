import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useConnectionStore } from "@/store/slices/connectionStore";

export const Route = createFileRoute("/_app/settings/developer")({
  component: DeveloperSettings,
});

function DeveloperSettings() {
  const developerMode = useSettingsStore((s) => s.developerMode);
  const setDeveloperMode = useSettingsStore((s) => s.setDeveloperMode);
  const status = useConnectionStore((s) => s.status);
  const latency = useConnectionStore((s) => s.latencyMs);

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
      </GlassPanel>
      <GlassPanel>
        <div className="text-sm font-semibold">Verbindung</div>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium capitalize">{status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Latenz</dt>
            <dd className="font-medium">{latency ? `${latency} ms` : "—"}</dd>
          </div>
        </dl>
      </GlassPanel>
    </>
  );
}
