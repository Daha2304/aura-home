import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { useSearchHistoryStore } from "@/store/slices/searchHistoryStore";

export const Route = createFileRoute("/_app/search/history")({
  head: () => ({ meta: [{ title: "Suchverlauf · Smart Home" }] }),
  component: SearchHistoryPage,
});

function SearchHistoryPage() {
  const entries = useSearchHistoryStore((s) => s.entries);
  const opens = useSearchHistoryStore((s) => s.opens);
  const clear = useSearchHistoryStore((s) => s.clearAll);

  return (
    <>
      <PageHeader
        title="Suchverlauf"
        subtitle="Zuletzt gesucht und zuletzt geöffnet"
      />
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => clear()}
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs"
        >
          Verlauf leeren
        </button>
      </div>
      <h2 className="mb-2 text-xs uppercase text-muted-foreground">Zuletzt gesucht</h2>
      <div className="mb-4 space-y-1.5">
        {entries.slice(0, 20).map((e) => (
          <GlassCard key={e.id} className="text-sm">
            {e.query}{" "}
            <span className="text-xs text-muted-foreground">
              · {e.resultCount ?? 0} Treffer
            </span>
          </GlassCard>
        ))}
        {entries.length === 0 && (
          <div className="text-sm text-muted-foreground">Kein Verlauf.</div>
        )}
      </div>
      <h2 className="mb-2 text-xs uppercase text-muted-foreground">Zuletzt geöffnet</h2>
      <div className="space-y-1.5">
        {opens.slice(0, 20).map((o) => (
          <GlassCard key={o.id} className="text-sm">
            {o.title}
            <span className="ml-2 text-xs text-muted-foreground">
              · {o.category}
            </span>
          </GlassCard>
        ))}
        {opens.length === 0 && (
          <div className="text-sm text-muted-foreground">Nichts geöffnet.</div>
        )}
      </div>
    </>
  );
}
