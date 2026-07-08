import { GlassCard } from "@/components/glass/GlassCard";
import { SectionTitle } from "@/components/common/SectionTitle";
import { ShieldCheck } from "lucide-react";

export function SecurityWidget() {
  return (
    <section className="space-y-2">
      <SectionTitle>Sicherheit</SectionTitle>
      <GlassCard className="flex items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-success/15 text-success">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="text-base font-semibold">Keine Warnungen</div>
          <div className="text-xs text-muted-foreground">
            Kameras, Alarm, Sensoren
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
