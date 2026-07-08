import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Moon, Sun, Contrast } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { useUiStore } from "@/store/slices/uiStore";
import type { ThemeMode } from "@/store/slices/uiStore";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/appearance")({
  component: AppearanceSettings,
});

const options: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "system", label: "System", icon: Contrast },
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
];

function AppearanceSettings() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const reduceMotion = useUiStore((s) => s.reduceMotion);
  const setReduceMotion = useUiStore((s) => s.setReduceMotion);

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Darstellung" />

      <GlassPanel className="mb-4">
        <div className="mb-3 text-sm font-semibold">Theme</div>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => {
            const Icon = o.icon;
            const active = theme === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setTheme(o.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-medium transition-colors",
                  active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-glass-border text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {o.label}
              </button>
            );
          })}
        </div>
      </GlassPanel>

      <GlassPanel>
        <label className="flex items-center justify-between text-sm">
          <div>
            <div className="font-medium">Animationen reduzieren</div>
            <div className="text-xs text-muted-foreground">
              Weniger Bewegung und Übergänge
            </div>
          </div>
          <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
        </label>
      </GlassPanel>
    </>
  );
}
