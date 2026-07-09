import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useStatisticsStore, useEnergyStore } from "@/store/slices/statisticsStore";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Smart Home" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const stats = useStatisticsStore((s) => Object.values(s.snapshots));
  const energy = useEnergyStore((s) => Object.values(s.entries));

  return (
    <>
      <PageHeader title="Analytics" subtitle="Kennzahlen und Diagramme" />
      {stats.length === 0 && energy.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Analytics vorbereitet"
          description="Sobald Contributoren Snapshots liefern, erscheinen sie hier."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <GlassCard key={s.id} className="p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="text-lg font-semibold">
                {s.value}{s.unit ? ` ${s.unit}` : ""}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
