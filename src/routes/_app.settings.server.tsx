import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ChevronLeft,
  Cloud,
  Copy,
  Download,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";
import { ServerCard } from "@/components/onboarding/ServerCard";
import { ImportDialog } from "@/components/onboarding/ImportDialog";
import { downloadServersFile } from "@/services/onboarding/serverImportExport";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/settings/server")({
  component: ServerSettings,
});

function ServerSettings() {
  const navigate = useNavigate();
  const servers = useSettingsStore((s) => s.servers);
  const activeId = useSettingsStore((s) => s.activeServerId);
  const setActive = useSettingsStore((s) => s.setActiveServer);
  const removeServer = useSettingsStore((s) => s.removeServer);
  const duplicateServer = useSettingsStore((s) => s.duplicateServer);
  const toggleFavorite = useSettingsStore((s) => s.toggleFavorite);
  const replaceServers = useSettingsStore((s) => s.replaceServers);
  const status = useConnectionStore((s) => s.status);
  const [importOpen, setImportOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const activeStatus =
    status === "authenticated" || status === "connected" ? "online" : "offline";

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
          <div className="flex gap-1.5">
            <GlassButton
              variant="ghost"
              size="sm"
              aria-label="Importieren"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="sm"
              aria-label="Server hinzufügen"
              onClick={() => navigate({ to: "/settings/server/new" })}
            >
              <Plus className="h-4 w-4" />
            </GlassButton>
          </div>
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
            <div key={s.id} className="relative">
              <ServerCard
                server={s}
                active={activeId === s.id}
                status={activeId === s.id ? activeStatus : "unknown"}
                onClick={() =>
                  setOpenMenu(openMenu === s.id ? null : s.id)
                }
              />
              {openMenu === s.id && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel mt-1.5 grid grid-cols-2 gap-1 rounded-2xl p-1.5"
                >
                  <MenuBtn
                    icon={Pencil}
                    label="Bearbeiten"
                    onClick={() => {
                      setOpenMenu(null);
                      navigate({
                        to: "/settings/server/$id",
                        params: { id: s.id },
                      });
                    }}
                  />
                  <MenuBtn
                    icon={Star}
                    label={s.favorite ? "Kein Favorit" : "Favorit"}
                    onClick={() => toggleFavorite(s.id)}
                  />
                  <MenuBtn
                    icon={Copy}
                    label="Duplizieren"
                    onClick={() => {
                      duplicateServer(s.id);
                      setOpenMenu(null);
                    }}
                  />
                  <MenuBtn
                    icon={Cloud}
                    label={activeId === s.id ? "Aktiv" : "Aktivieren"}
                    onClick={() => setActive(s.id)}
                  />
                  <MenuBtn
                    icon={Download}
                    label="Exportieren"
                    onClick={() => downloadServersFile([s])}
                  />
                  <MenuBtn
                    icon={Trash2}
                    label="Löschen"
                    danger
                    onClick={() => {
                      removeServer(s.id);
                      setOpenMenu(null);
                    }}
                  />
                </motion.div>
              )}
            </div>
          ))}
          {servers.length > 0 && (
            <GlassButton
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              onClick={() => downloadServersFile(servers)}
            >
              <Download className="h-4 w-4" /> Alle exportieren
            </GlassButton>
          )}
        </div>
      )}

      <ImportDialog
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onImport={(list, mode) => {
          replaceServers(list, mode);
          setImportOpen(false);
        }}
      />
    </>
  );
}

function MenuBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Cloud;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-white/5 ${
        danger ? "text-destructive" : ""
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
