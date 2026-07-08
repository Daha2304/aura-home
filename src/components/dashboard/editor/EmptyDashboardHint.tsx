import { Sparkles } from "lucide-react";

export function EmptyDashboardHint() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="glass-panel hairline flex flex-col items-center gap-2 rounded-[24px] px-8 py-6 text-center">
        <Sparkles className="h-6 w-6 text-primary" />
        <div className="text-sm font-semibold">Dashboard ist leer</div>
        <div className="text-xs text-muted-foreground">
          Öffne die Werkzeugleiste und ziehe Widgets auf die Fläche.
        </div>
      </div>
    </div>
  );
}
