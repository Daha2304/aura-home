import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { useVersionStore } from "@/services/version";
import { useUpdateStore } from "@/store/slices/updateStore";

export const Route = createFileRoute("/_app/settings/app")({
  head: () => ({ meta: [{ title: "App-Informationen · Einstellungen" }] }),
  component: AppInfoSettings,
});

function AppInfoSettings() {
  const app = useVersionStore((s) => s.appVersion);
  const dataModel = useVersionStore((s) => s.dataModelVersion);
  const cache = useVersionStore((s) => s.cacheVersion);
  const backup = useVersionStore((s) => s.backupVersion);
  const installed = useVersionStore((s) => s.installedAt);
  const swVersion = useUpdateStore((s) => s.currentVersion);

  const rows: Array<{ label: string; value: string }> = [
    { label: "App-Version", value: app },
    { label: "Datenmodell", value: `v${dataModel}` },
    { label: "Cache", value: `v${cache}` },
    { label: "Backup-Schema", value: `v${backup}` },
    { label: "Service Worker", value: swVersion ?? "nicht aktiv" },
    {
      label: "Installiert",
      value: installed ? new Date(installed).toLocaleString() : "–",
    },
    {
      label: "Umgebung",
      value: import.meta.env.PROD ? "Production" : "Development",
    },
  ];

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="App-Informationen" subtitle="Versionen und Umgebung" />

      <GlassPanel className="space-y-2">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-accent" aria-hidden />
          <div className="text-sm">Smart Home Zentrale</div>
        </div>
        <dl className="mt-2 divide-y divide-white/5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-2 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      </GlassPanel>
    </>
  );
}
