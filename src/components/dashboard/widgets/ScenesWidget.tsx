import { SectionTitle } from "@/components/common/SectionTitle";
import { useScenesStore } from "@/store/slices/scenesStore";
import { SceneCard } from "@/components/scenes/SceneCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Sparkles } from "lucide-react";

export function ScenesWidget() {
  const scenes = useScenesStore((s) => s.scenes.slice(0, 4));
  return (
    <section className="space-y-2">
      <SectionTitle>Szenen</SectionTitle>
      {scenes.length === 0 ? (
        <EmptyState icon={Sparkles} title="Noch keine Szenen" />
      ) : (
        <div className="space-y-2">
          {scenes.map((s) => (
            <SceneCard key={s.id} scene={s} />
          ))}
        </div>
      )}
    </section>
  );
}
