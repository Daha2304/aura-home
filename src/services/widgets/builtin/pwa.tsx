/**
 * PWA / System-Status Widgets.
 *
 * Registered via WidgetRegistry (no parallel widget system). Each widget
 * reads from the corresponding store and renders a compact glass tile.
 */
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import type { LayoutBreakpoint } from "@/models/layout";
import { CloudOff, CloudCheck, RefreshCw, Database, HardDrive } from "lucide-react";
import { useOfflineStore } from "@/store/slices/offlineStore";
import { useUpdateStore } from "@/store/slices/updateStore";
import { useVersionStore } from "@/services/version";
import { cacheManager } from "@/services/cache";
import { useEffect, useState } from "react";

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
  tone?: "default" | "warn" | "ok";
}) {
  const toneCls =
    tone === "warn"
      ? "text-amber-400"
      : tone === "ok"
        ? "text-emerald-400"
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

function OfflineStatusWidget() {
  const online = useOfflineStore((s) => s.online);
  return (
    <Tile
      icon={online ? CloudCheck : CloudOff}
      title="Verbindung"
      value={online ? "Online" : "Offline"}
      tone={online ? "ok" : "warn"}
    />
  );
}

function SyncStatusWidget() {
  const pending = useOfflineStore((s) => s.pendingCount);
  const syncing = useOfflineStore((s) => s.syncing);
  return (
    <Tile
      icon={RefreshCw}
      title="Synchronisation"
      value={syncing ? "Sync läuft" : pending > 0 ? `${pending} ausstehend` : "Aktuell"}
      tone={pending > 0 ? "warn" : "ok"}
    />
  );
}

function UpdateStatusWidget() {
  const available = useUpdateStore((s) => s.available);
  const version = useUpdateStore((s) => s.currentVersion);
  return (
    <Tile
      icon={RefreshCw}
      title="App-Update"
      value={available ? "Update verfügbar" : "Aktuell"}
      hint={version ?? undefined}
      tone={available ? "warn" : "ok"}
    />
  );
}

function BackupStatusWidget() {
  const app = useVersionStore((s) => s.appVersion);
  const installed = useVersionStore((s) => s.installedAt);
  return (
    <Tile
      icon={Database}
      title="Backup"
      value={`App v${app}`}
      hint={installed ? `installiert ${new Date(installed).toLocaleDateString()}` : undefined}
    />
  );
}

function StorageStatusWidget() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const used = (await cacheManager.usageBytes()) ?? 0;
      const quota = (await cacheManager.quotaBytes()) ?? 0;
      if (!cancelled) setUsage({ used, quota });
    })();
    return () => { cancelled = true; };
  }, []);
  const fmt = (bytes: number) => {
    if (!bytes) return "–";
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
  };
  return (
    <Tile
      icon={HardDrive}
      title="Speicher"
      value={usage ? fmt(usage.used) : "–"}
      hint={usage?.quota ? `von ${fmt(usage.quota)}` : undefined}
    />
  );
}

export const PWA_WIDGET_IDS = [
  "pwa.offlineStatus",
  "pwa.syncStatus",
  "pwa.updateStatus",
  "pwa.backupStatus",
  "pwa.storageStatus",
];

export function registerPwaWidgets(): void {
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
      id: "pwa.offlineStatus",
      name: "Offline-Status",
      description: "Zeigt aktuelle Verbindung.",
      icon: "cloud-off",
      capabilities: [...common.capabilities],
      render: () => <OfflineStatusWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "pwa.syncStatus",
      name: "Sync-Status",
      description: "Offene Commands & Synchronisation.",
      icon: "refresh-cw",
      capabilities: [...common.capabilities],
      render: () => <SyncStatusWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "pwa.updateStatus",
      name: "Update-Status",
      description: "Verfügbare App-Updates.",
      icon: "refresh-cw",
      capabilities: [...common.capabilities],
      render: () => <UpdateStatusWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "pwa.backupStatus",
      name: "Backup-Status",
      description: "App-Version & Installation.",
      icon: "database",
      capabilities: [...common.capabilities],
      render: () => <BackupStatusWidget />,
    }),
  );
  widgetRegistry.register(
    defineWidget({
      ...common,
      id: "pwa.storageStatus",
      name: "Speicher-Status",
      description: "Belegter lokaler Speicher.",
      icon: "hard-drive",
      capabilities: [...common.capabilities],
      render: () => <StorageStatusWidget />,
    }),
  );
}
