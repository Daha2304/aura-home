import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronRight,
  History,
  Layers,
  LineChart,
  Settings as SettingsIcon,
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
  { to: "/groups", label: "Gerätegruppen", hint: "Verschachtelte Gruppen, Fan-out, Schnellaktionen", icon: Layers },
  { to: "/automations", label: "Automationen", hint: "Auslöser, Bedingungen, Aktionen", icon: Workflow },
  { to: "/timeline", label: "Timeline", hint: "Zentrale Ereignis-Timeline aller Quellen", icon: History },
  { to: "/history", label: "Historie", hint: "Abgeschlossene Ausführungen", icon: History },
  { to: "/analytics", label: "Analytics", hint: "Kennzahlen und Diagramme", icon: LineChart },
  { to: "/statistics", label: "Statistik", hint: "Energie, Klima, Verlauf", icon: BarChart3 },
  { to: "/settings", label: "Einstellungen", hint: "Server, Benutzer, Themes", icon: SettingsIcon },
];

function MorePage() {
  return (
    <>
      <PageHeader title="Mehr" />
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
