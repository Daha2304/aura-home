import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { searchManager } from "@/services/search/SearchManager";
import type { SearchResult } from "@/models/search";

export const Route = createFileRoute("/_app/search/results")({
  head: () => ({ meta: [{ title: "Suchergebnisse · Smart Home" }] }),
  component: SearchResultsPage,
});

function SearchResultsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const r = await searchManager.search(query);
      setResults(r);
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <PageHeader title="Ergebnisse" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Suchen…"
        className="mb-3 w-full rounded-2xl bg-white/5 px-4 py-3 outline-none"
        aria-label="Suchbegriff"
      />
      <div className="space-y-2">
        {results.map((r) => (
          <GlassCard key={r.id} className="text-sm">
            <div className="font-medium">{r.title}</div>
            {r.subtitle && (
              <div className="text-xs text-muted-foreground">{r.subtitle}</div>
            )}
          </GlassCard>
        ))}
        {results.length === 0 && query.trim() && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Keine Treffer.
          </div>
        )}
      </div>
    </>
  );
}
