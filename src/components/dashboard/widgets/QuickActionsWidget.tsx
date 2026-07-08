import { Home, MoonStar, Sun, LogOut } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionTitle } from "@/components/common/SectionTitle";

const actions = [
  { icon: Sun, label: "Guten Morgen" },
  { icon: MoonStar, label: "Gute Nacht" },
  { icon: Home, label: "Zuhause" },
  { icon: LogOut, label: "Verlassen" },
];

export function QuickActionsWidget() {
  return (
    <section className="space-y-2">
      <SectionTitle>Schnellaktionen</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <GlassCard key={a.label} interactive className="flex items-center gap-3 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent/15 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
}
