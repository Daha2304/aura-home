import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Pin,
  Star,
  Archive,
  Inbox as InboxIcon,
  Search,
  Check,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { useNotificationsStore } from "@/store/slices/notificationsStore";
import { notificationManager } from "@/services/notifications/NotificationManager";
import { severityRegistry } from "@/services/timeline/SeverityRegistry";
import { eventCategoryRegistry } from "@/services/timeline/EventCategoryRegistry";
import type { AppNotification } from "@/models/notification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/inbox")({
  head: () => ({
    meta: [
      { title: "Ereignisse · Smart Home" },
      { name: "description", content: "Zentrale Inbox aller Ereignisse und Benachrichtigungen." },
    ],
  }),
  component: InboxRoute,
});

type Tab = "all" | "unread" | "favorites" | "pinned" | "archive";

function InboxRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Wenn eine Detail-Sub-Route aktiv ist, nur den Outlet zeigen.
  if (pathname !== "/inbox") return <Outlet />;
  return <InboxList />;
}

function InboxList() {
  const items = useNotificationsStore((s) => s.items);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");

  const filtered = useMemo(() => {
    let out = items;
    if (tab === "unread") out = out.filter((i) => !i.read && !i.archived);
    else if (tab === "favorites") out = out.filter((i) => i.favorite && !i.archived);
    else if (tab === "pinned") out = out.filter((i) => i.pinned && !i.archived);
    else if (tab === "archive") out = out.filter((i) => i.archived);
    else out = out.filter((i) => !i.archived);
    if (cat) out = out.filter((i) => i.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      out = out.filter(
        (i) =>
          i.title.toLowerCase().includes(s) ||
          i.message?.toLowerCase().includes(s),
      );
    }
    return out;
  }, [items, tab, q, cat]);

  const tabs: Array<{ id: Tab; label: string; icon: any }> = [
    { id: "all", label: "Alle", icon: InboxIcon },
    { id: "unread", label: "Ungelesen", icon: Bell },
    { id: "favorites", label: "Favoriten", icon: Star },
    { id: "pinned", label: "Angeheftet", icon: Pin },
    { id: "archive", label: "Archiv", icon: Archive },
  ];

  return (
    <>
      <PageHeader
        title="Ereignisse"
        trailing={
          <button
            onClick={() => notificationManager.markAllRead()}
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
            aria-label="Alle als gelesen markieren"
          >
            <Check className="h-3.5 w-3.5" /> Alle gelesen
          </button>
        }
      />

      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen…"
            aria-label="Ereignisse durchsuchen"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-accent"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCat("")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[11px]",
              !cat
                ? "border-accent bg-accent/20 text-accent"
                : "border-white/10 bg-white/5 text-muted-foreground",
            )}
          >
            Alle Kategorien
          </button>
          {eventCategoryRegistry.list().map((c) => (
            <button
              key={c.category}
              onClick={() => setCat(cat === c.category ? "" : c.category)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] capitalize",
                cat === c.category
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-white/10 bg-white/5 text-muted-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">
          Keine Ereignisse.
        </div>
      ) : (
        <ul className="space-y-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {filtered.map((n) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <NotificationRow n={n} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}

function severityDot(sev: AppNotification["severity"]): string {
  switch (sev) {
    case "success": return "bg-emerald-400";
    case "warning": return "bg-amber-400";
    case "error":   return "bg-red-500";
    case "critical":return "bg-red-600 ring-2 ring-red-500/50";
    default:        return "bg-sky-400";
  }
}

function NotificationRow({ n }: { n: AppNotification }) {
  const sev = severityRegistry.get(n.severity);
  return (
    <Link
      to="/inbox/$notificationId"
      params={{ notificationId: n.id }}
      className="block"
    >
      <GlassCard interactive className="flex items-start gap-3">
        <span
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", severityDot(n.severity))}
          aria-label={sev.label}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-semibold leading-tight">
              {!n.read && <span className="mr-1 text-accent">●</span>}
              {n.title}
            </div>
            <div className="shrink-0 text-[10px] text-muted-foreground">
              {new Date(n.createdAt).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          {n.message && (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {n.message}
            </div>
          )}
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            {n.category && <span className="capitalize">{n.category}</span>}
            {n.pinned && <Pin className="h-3 w-3" aria-label="Angeheftet" />}
            {n.favorite && <Star className="h-3 w-3" aria-label="Favorit" />}
            {n.archived && <Archive className="h-3 w-3" />}
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      </GlassCard>
    </Link>
  );
}
