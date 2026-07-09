import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, HardDrive, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { cacheManager, type CacheBucketDescriptor } from "@/services/cache";

export const Route = createFileRoute("/_app/settings/storage")({
  head: () => ({ meta: [{ title: "Speicher · Einstellungen" }] }),
  component: StorageSettings,
});

function fmt(bytes: number | null): string {
  if (bytes == null) return "–";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function StorageSettings() {
  const [buckets, setBuckets] = useState<Array<CacheBucketDescriptor & { entries: number }>>([]);
  const [usage, setUsage] = useState<{ used: number | null; quota: number | null }>({
    used: null,
    quota: null,
  });
  const [busy, setBusy] = useState(false);

  async function refresh(): Promise<void> {
    await cacheManager.init();
    const list = cacheManager.list();
    const rows = await Promise.all(
      list.map(async (b) => ({ ...b, entries: await b.size() })),
    );
    setBuckets(rows);
    setUsage({
      used: await cacheManager.usageBytes(),
      quota: await cacheManager.quotaBytes(),
    });
  }

  useEffect(() => { void refresh(); }, []);

  async function purge(id?: string): Promise<void> {
    setBusy(true);
    try {
      await cacheManager.invalidate(id);
      await refresh();
    } finally { setBusy(false); }
  }

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Speicher" subtitle="Lokale Caches verwalten" />

      <GlassPanel className="space-y-2" aria-live="polite">
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-accent" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Belegter Speicher</div>
            <div className="truncate text-xs text-muted-foreground">
              {fmt(usage.used)} von {fmt(usage.quota)}
            </div>
          </div>
          <GlassButton variant="ghost" size="sm" onClick={() => void refresh()}>
            Aktualisieren
          </GlassButton>
        </div>
      </GlassPanel>

      <div className="mt-3 space-y-2">
        {buckets.map((b) => (
          <GlassPanel key={b.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{b.label}</div>
              <div className="truncate text-xs text-muted-foreground">
                {b.entries} Einträge · {b.cacheName ?? "in-memory"}
              </div>
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => void purge(b.id)}
              disabled={busy}
            >
              <Trash2 className="h-4 w-4" /> Leeren
            </GlassButton>
          </GlassPanel>
        ))}
      </div>

      <div className="mt-3">
        <GlassButton
          variant="ghost"
          size="md"
          onClick={() => void purge()}
          disabled={busy}
        >
          <Trash2 className="h-4 w-4" /> Alle Caches leeren
        </GlassButton>
      </div>
    </>
  );
}
