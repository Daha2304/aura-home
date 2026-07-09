import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { GlassCard } from "@/components/glass/GlassCard";

export const Route = createFileRoute("/_app/search")({
  head: () => ({ meta: [{ title: "Suche · Smart Home" }] }),
  component: SearchLayout,
});

function SearchLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/search") return <Outlet />;
  return (
    <>
      <PageHeader title="Suche" subtitle="Global über alle Registrierungen" />
      <div className="space-y-3">
        <SearchBar placeholder="Geräte, Räume, Szenen, Befehle…" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Link to="/search/history" className="block">
            <GlassCard interactive className="text-sm">Verlauf</GlassCard>
          </Link>
          <Link to="/search/favorites" className="block">
            <GlassCard interactive className="text-sm">Favoriten</GlassCard>
          </Link>
          <Link to="/search/results" className="block">
            <GlassCard interactive className="text-sm">Ergebnisse</GlassCard>
          </Link>
        </div>
      </div>
    </>
  );
}
