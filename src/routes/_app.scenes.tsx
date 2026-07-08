import { createFileRoute } from "@tanstack/react-router";
import { Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useScenesStore } from "@/store/slices/scenesStore";
import { SceneCard } from "@/components/scenes/SceneCard";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassButton } from "@/components/glass/GlassButton";

export const Route = createFileRoute("/_app/scenes")({
  head: () => ({ meta: [{ title: "Szenen · Smart Home" }] }),
  component: ScenesPage,
});

function ScenesPage() {
  const scenes = useScenesStore((s) => s.scenes);
  return (
    <>
      <PageHeader
        title="Szenen"
        subtitle={`${scenes.length} Szene${scenes.length === 1 ? "" : "n"}`}
        trailing={
          <GlassButton variant="ghost" size="sm" aria-label="Szene hinzufügen">
            <Plus className="h-4 w-4" />
          </GlassButton>
        }
      />
      {scenes.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Noch keine Szenen"
          description="Erstelle Szenen, um mehrere Geräte gleichzeitig zu steuern."
        />
      ) : (
        <div className="space-y-2">
          {scenes.map((s) => (
            <SceneCard key={s.id} scene={s} />
          ))}
        </div>
      )}
    </>
  );
}
