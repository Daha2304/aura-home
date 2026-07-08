import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Cloud, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_app/settings/server")({
  component: ServerSettings,
});

function ServerSettings() {
  const servers = useSettingsStore((s) => s.servers);
  const activeId = useSettingsStore((s) => s.activeServerId);
  const setActive = useSettingsStore((s) => s.setActiveServer);

  return (
    <>
      <Link
        to="/settings"
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader
        title="Server"
        subtitle="WebSocket-Verbindungen verwalten"
        trailing={
          <GlassButton variant="ghost" size="sm" aria-label="Server hinzufügen">
            <Plus className="h-4 w-4" />
          </GlassButton>
        }
      />
      {servers.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="Kein Server konfiguriert"
          description="Füge einen WebSocket-Server hinzu, um Geräte zu laden."
        />
      ) : (
        <div className="space-y-2">
          {servers.map((s) => (
            <GlassCard
              key={s.id}
              interactive
              onClick={() => setActive(s.id)}
              className="flex items-center gap-3"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
                <Cloud className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{s.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {(s.ssl ? "wss" : "ws")}://{s.host}:{s.port}
                </div>
              </div>
              {activeId === s.id && (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                  Aktiv
                </span>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
