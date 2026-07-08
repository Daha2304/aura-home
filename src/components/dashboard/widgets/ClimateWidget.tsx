import { GlassCard } from "@/components/glass/GlassCard";
import { SectionTitle } from "@/components/common/SectionTitle";
import { Droplets, Thermometer } from "lucide-react";

export function ClimateWidget() {
  return (
    <section className="space-y-2">
      <SectionTitle>Klima</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Thermometer className="h-4 w-4" /> Temperatur
          </div>
          <div className="text-2xl font-bold tracking-tight">—°C</div>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Droplets className="h-4 w-4" /> Luftfeuchte
          </div>
          <div className="text-2xl font-bold tracking-tight">—%</div>
        </GlassCard>
      </div>
    </section>
  );
}
