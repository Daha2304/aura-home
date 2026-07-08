import type { Scene } from "@/models/scene";
import { GlassCard } from "@/components/glass/GlassCard";
import { Sparkles } from "lucide-react";

export function SceneCard({ scene }: { scene: Scene }) {
  return (
    <GlassCard interactive className="flex items-center gap-3">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-accent"
        style={{ background: scene.color ?? "oklch(0.75 0.14 250 / 0.2)" }}
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{scene.name}</div>
        <div className="text-xs text-muted-foreground">
          {scene.actions.length} Aktion{scene.actions.length === 1 ? "" : "en"}
        </div>
      </div>
    </GlassCard>
  );
}
