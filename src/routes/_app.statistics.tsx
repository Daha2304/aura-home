import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_app/statistics")({
  head: () => ({ meta: [{ title: "Statistik · Smart Home" }] }),
  component: StatisticsPage,
});

function StatisticsPage() {
  return (
    <>
      <PageHeader
        title="Statistik"
        subtitle="Energie, Klima und Aktivität"
      />
      <div className="space-y-4">
        <GlassCard className="h-48">
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <BarChart3 className="h-8 w-8" />
            <span className="text-sm">Diagramme erscheinen mit Live-Daten</span>
          </div>
        </GlassCard>
        <EmptyState
          icon={BarChart3}
          title="Keine Daten"
          description="Statistiken erscheinen, sobald der Server historische Daten liefert."
        />
      </div>
    </>
  );
}
