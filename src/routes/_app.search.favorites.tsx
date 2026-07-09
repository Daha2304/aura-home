import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { useSearchFavoritesStore } from "@/store/slices/searchFavoritesStore";

export const Route = createFileRoute("/_app/search/favorites")({
  head: () => ({ meta: [{ title: "Such-Favoriten · Smart Home" }] }),
  component: SearchFavoritesPage,
});

function SearchFavoritesPage() {
  const favorites = useSearchFavoritesStore((s) => s.favorites);
  const remove = useSearchFavoritesStore((s) => s.remove);

  return (
    <>
      <PageHeader title="Favoriten" subtitle="Gespeicherte Suchergebnisse" />
      <div className="space-y-1.5">
        {favorites.map((f) => (
          <GlassCard key={f.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 truncate">{f.title}</span>
            <span className="text-xs text-muted-foreground">{f.category}</span>
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="rounded bg-white/5 px-2 py-1 text-xs"
            >
              Entfernen
            </button>
          </GlassCard>
        ))}
        {favorites.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Noch keine Favoriten.
          </div>
        )}
      </div>
    </>
  );
}
