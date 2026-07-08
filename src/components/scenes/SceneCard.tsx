import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, Star } from "lucide-react";
import type { Scene } from "@/models/scene";
import { GlassCard } from "@/components/glass/GlassCard";
import { sceneExecutor, sceneManager } from "@/services/scenes";
import { useSceneExecutionsStore, selectLatestExecution } from "@/store/slices/sceneExecutionsStore";
import { cn } from "@/lib/utils";

interface Props {
  scene: Scene;
  onOpen?: (id: string) => void;
}

/**
 * Presentational scene tile. Runs the scene via {@link SceneExecutor}
 * (which uses the CommandQueue). Progress reflects live execution.
 */
export const SceneCard = memo(function SceneCard({ scene, onOpen }: Props) {
  const latest = useSceneExecutionsStore(selectLatestExecution(scene.id));
  const running = latest?.status === "running" || latest?.status === "planned";
  const progress = useMemo(() => {
    if (!latest || latest.progress.total === 0) return 0;
    const done = latest.progress.completed + latest.progress.failed + latest.progress.cancelled;
    return Math.min(1, done / latest.progress.total);
  }, [latest]);

  return (
    <GlassCard
      interactive
      accent={scene.color}
      onClick={() => onOpen?.(scene.id)}
      className="flex items-center gap-3"
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-accent"
        style={{ background: scene.color ?? "oklch(0.75 0.14 250 / 0.2)" }}
      >
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-[15px] font-semibold">{scene.name}</div>
          {scene.favorite && <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />}
        </div>
        <div className="text-xs text-muted-foreground">
          {scene.actions.length} Aktion{scene.actions.length === 1 ? "" : "en"}
          {scene.tags.length > 0 ? ` · ${scene.tags.slice(0, 2).join(", ")}` : ""}
        </div>
        {running && (
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label={`Szene ${scene.name} ausführen`}
        onClick={(e) => {
          e.stopPropagation();
          sceneExecutor.run(scene.id);
        }}
        disabled={running}
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-md shadow-primary/25 transition",
          running && "opacity-70",
        )}
      >
        <Play className="h-4 w-4" fill="currentColor" />
      </button>
    </GlassCard>
  );
});

export function toggleSceneFavorite(id: string): void {
  sceneManager.toggleFavorite(id);
}
