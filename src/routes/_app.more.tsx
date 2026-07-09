import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronRight,
  History,
  Layers,
  LineChart,
  Settings as SettingsIcon,
  ShieldCheck,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { useNotificationsStore, selectUnreadCount } from "@/store/slices/notificationsStore";

export const Route = createFileRoute("/_app/more")({
  head: () => ({ meta: [{ title: "Mehr · Smart Home" }] }),
  component: MorePage,
});

interface Entry {
  to: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const entries: Entry[] = [
  { to: "/inbox", label: "Ereignisse", hint: "Benachrichtigungen, Warnungen, Fehler", icon: Bell },
  { to: "/groups", label: "Gerätegruppen", hint: "Verschachtelte Gruppen, Fan-out, Schnellaktionen", icon: Layers },
  { to: "/automations", label: "Automationen", hint: "Auslöser, Bedingungen, Aktionen", icon: Workflow },
  { to: "/timeline", label: "Timeline", hint: "Zentrale Ereignis-Timeline aller Quellen", icon: History },
  { to: "/history", label: "Historie", hint: "Abgeschlossene Ausführungen", icon: History },
  { to: "/analytics", label: "Analytics", hint: "Kennzahlen und Diagramme", icon: LineChart },
  { to: "/statistics", label: "Statistik", hint: "Energie, Klima, Verlauf", icon: BarChart3 },
  { to: "/users", label: "Benutzer", hint: "Benutzer, Favoriten, Rollen", icon: Users },
  { to: "/profiles", label: "Profile", hint: "Familie, Kinder, Gast, Techniker", icon: UserCog },
  { to: "/roles", label: "Rollen", hint: "Rollen und Berechtigungen", icon: ShieldCheck },
  { to: "/permissions", label: "Berechtigungen", hint: "Effektive Zugriffsrechte", icon: ShieldCheck },
  { to: "/settings", label: "Einstellungen", hint: "Server, Benutzer, Themes", icon: SettingsIcon },
];

function MorePage() {
  const unread = useNotificationsStore(selectUnreadCount);
  return (
    <>
      <PageHeader title="Mehr" />
      <div className="space-y-2">
        {entries.map((e) => {
          const Icon = e.icon;
          const badge = e.to === "/inbox" && unread > 0 ? unread : null;
          return (
            <Link key={e.to} to={e.to} className="block">
              <GlassCard interactive className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[15px] font-semibold">
                    {e.label}
                    {badge !== null && (
                      <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                        {badge}
                      </span>
                    )}
                  </div>
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
