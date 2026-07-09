import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Cloud,
  Database,
  ChevronRight,
  Languages,
  Palette,
  TerminalSquare,
  Users,
  CloudOff,
  Upload,
  Sparkles,
  HardDrive,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Einstellungen · Smart Home" }] }),
  component: SettingsLayout,
});

function SettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/settings") return <Outlet />;
  return <SettingsIndex />;
}

interface Entry {
  to: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const entries: Entry[] = [
  { to: "/settings/server", label: "Server", hint: "WebSocket-Verbindung", icon: Cloud },
  { to: "/settings/users", label: "Benutzer", hint: "Rollen und Zugriff", icon: Users },
  { to: "/settings/appearance", label: "Darstellung", hint: "Theme, Animationen", icon: Palette },
  { to: "/settings/language", label: "Sprache", hint: "Deutsch, Englisch", icon: Languages },
  { to: "/settings/notifications", label: "Benachrichtigungen", hint: "Push-Meldungen", icon: Bell },
  { to: "/settings/offline", label: "Offline", hint: "Verbindung & Sync", icon: CloudOff },
  { to: "/settings/backup", label: "Backup", hint: "Export sichern", icon: Database },
  { to: "/settings/restore", label: "Restore", hint: "Backup einspielen", icon: Upload },
  { to: "/settings/update", label: "App-Update", hint: "Aktualisierungen", icon: Sparkles },
  { to: "/settings/storage", label: "Speicher", hint: "Caches verwalten", icon: HardDrive },
  { to: "/settings/app", label: "App-Informationen", hint: "Versionen", icon: Info },
  { to: "/settings/developer", label: "Entwickler", hint: "Diagnose, Logs", icon: TerminalSquare },
];

function SettingsIndex() {
  return (
    <>
      <PageHeader title="Einstellungen" />
      <div className="space-y-2">
        {entries.map((e) => {
          const Icon = e.icon;
          return (
            <Link key={e.to} to={e.to} className="block">
              <GlassCard interactive className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{e.label}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {e.hint}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </GlassCard>
            </Link>
          );
        })}
      </div>
    </>
  );
}
