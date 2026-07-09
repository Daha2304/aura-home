import { createFileRoute, Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useTimelineStore } from "@/store/slices/timelineStore";

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "Historie · Smart Home" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const entries = useTimelineStore((s) =>
    s.entries.filter((e) => e.kind === "completed" || e.kind === "failed"),
  );
  return (
    <>
      <PageHeader title="Historie" subtitle="Abgeschlossene Ausführungen" />
      {entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="Keine Historie"
          description={<span>Ausführungen erscheinen hier. Vollständige Live-Ansicht: <Link to="/timeline" className="underline">Timeline</Link>.</span>}
        />
      ) : (
        <ul className="space-y-1.5">
          {entries.slice(0, 200).map((e) => (
            <li key={e.id}>
              <GlassCard className="p-3">
                <div className="text-sm font-medium">{e.title ?? e.kind}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(e.timestamp).toLocaleString()} · {e.source} · {e.kind}
                </div>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
