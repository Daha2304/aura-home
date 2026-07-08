import { GlassCard } from "@/components/glass/GlassCard";
import { SectionTitle } from "@/components/common/SectionTitle";
import { Gauge } from "lucide-react";

export function EnergyWidget() {
  return (
    <section className="space-y-2">
      <SectionTitle>Energie</SectionTitle>
      <GlassCard className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-accent">
          <Gauge className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-bold tracking-tight">— W</div>
          <div className="text-xs text-muted-foreground">
            Aktueller Verbrauch
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
