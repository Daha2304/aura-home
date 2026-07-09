import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Pin, Star, Archive, Trash2, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassCard } from "@/components/glass/GlassCard";
import { useNotificationsStore } from "@/store/slices/notificationsStore";
import { useTimelineStore } from "@/store/slices/timelineStore";
import { notificationManager } from "@/services/notifications/NotificationManager";
import { severityRegistry } from "@/services/timeline/SeverityRegistry";
import { eventCategoryRegistry } from "@/services/timeline/EventCategoryRegistry";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/inbox/$notificationId")({
  component: NotificationDetail,
});

function NotificationDetail() {
  const { notificationId } = Route.useParams();
  const navigate = useNavigate();
  const n = useNotificationsStore((s) => s.byId[notificationId]);

  useEffect(() => {
    if (n && !n.read) notificationManager.markRead(notificationId);
  }, [n, notificationId]);

  const related = useTimelineStore((s) =>
    n?.refId ? s.entries.filter((e) => e.refId === n.refId).slice(0, 20) : [],
  );

  if (!n) {
    return (
      <>
        <Link to="/inbox" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
          <ChevronLeft className="h-4 w-4" /> Ereignisse
        </Link>
        <PageHeader title="Nicht gefunden" />
        <p className="text-sm text-muted-foreground">Diese Benachrichtigung existiert nicht mehr.</p>
      </>
    );
  }

  const sev = severityRegistry.get(n.severity);
  const cat = n.category ? eventCategoryRegistry.get(n.category) : undefined;

  return (
    <>
      <Link to="/inbox" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Ereignisse
      </Link>
      <PageHeader title={n.title} />

      <GlassPanel className="mb-3 space-y-3">
        {n.message && <p className="text-sm">{n.message}</p>}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Severity: <span className="text-foreground">{sev.label}</span></div>
          {cat && <div>Kategorie: <span className="text-foreground">{cat.label}</span></div>}
          <div>Zeit: <span className="text-foreground">{new Date(n.createdAt).toLocaleString()}</span></div>
          {n.source && <div>Quelle: <span className="text-foreground">{n.source}</span></div>}
          {n.refType && n.refId && (
            <div className="col-span-2">
              Referenz: <span className="text-foreground">{n.refType} · {n.refId}</span>
            </div>
          )}
        </div>
      </GlassPanel>

      <div className="mb-3 flex flex-wrap gap-2">
        {n.actions?.map((a) => (
          <button
            key={a.id}
            onClick={() =>
              notificationManager.runAction(n.id, a, (to) =>
                navigate({ to: to as any }),
              )
            }
            className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground"
          >
            {a.label}
          </button>
        ))}
        <button
          onClick={() => notificationManager.pin(n.id, !n.pinned)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium"
        >
          <Pin className="mr-1 inline h-3.5 w-3.5" />{n.pinned ? "Lösen" : "Anheften"}
        </button>
        <button
          onClick={() => notificationManager.favorite(n.id, !n.favorite)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium"
        >
          <Star className="mr-1 inline h-3.5 w-3.5" />{n.favorite ? "Unfavorit" : "Favorit"}
        </button>
        <button
          onClick={() => notificationManager.acknowledge(n.id, !n.acknowledged)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium"
        >
          <Check className="mr-1 inline h-3.5 w-3.5" />Bestätigen
        </button>
        <button
          onClick={() => {
            notificationManager.archive(n.id, !n.archived);
            navigate({ to: "/inbox" });
          }}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium"
        >
          <Archive className="mr-1 inline h-3.5 w-3.5" />Archiv
        </button>
        <button
          onClick={() => {
            notificationManager.remove(n.id);
            navigate({ to: "/inbox" });
          }}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100"
        >
          <Trash2 className="mr-1 inline h-3.5 w-3.5" />Löschen
        </button>
      </div>

      {related.length > 0 && (
        <>
          <h2 className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">
            Zusammenhang
          </h2>
          <ul className="space-y-1.5">
            {related.map((e) => (
              <li key={e.id}>
                <GlassCard padded={false} className="flex items-center gap-2 p-2 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="truncate">{e.title ?? e.kind}</span>
                </GlassCard>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
