import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Search, Sparkles, Star, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassButton } from "@/components/glass/GlassButton";
import { SceneCard } from "@/components/scenes/SceneCard";
import { useScenesStore } from "@/store/slices/scenesStore";
import { sceneManager } from "@/services/scenes";
import type { SceneCategory } from "@/models/scene";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/scenes")({
  head: () => ({ meta: [{ title: "Szenen · Smart Home" }] }),
  component: ScenesPage,
});

const CATEGORIES: Array<{ id: SceneCategory | "all" | "favorites" | "recent"; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "favorites", label: "Favoriten" },
  { id: "recent", label: "Zuletzt" },
  { id: "light", label: "Licht" },
  { id: "climate", label: "Klima" },
  { id: "tv", label: "TV" },
  { id: "music", label: "Musik" },
  { id: "away", label: "Verlassen" },
  { id: "home", label: "Nach Hause" },
  { id: "sleep", label: "Schlafen" },
  { id: "wake", label: "Aufstehen" },
  { id: "custom", label: "Eigene" },
];

function ScenesPage() {
  const navigate = useNavigate();
  const scenes = useScenesStore((s) => s.scenes);
  const recentIds = useScenesStore((s) => s.recentIds);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<typeof CATEGORIES[number]["id"]>("all");

  const visible = useMemo(() => {
    let list = [...scenes].filter((s) => !s.archived);
    if (cat === "favorites") list = list.filter((s) => s.favorite);
    else if (cat === "recent") {
      const order = new Map(recentIds.map((id, i) => [id, i]));
      list = list
        .filter((s) => order.has(s.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    } else if (cat !== "all") {
      list = list.filter((s) => s.category === cat);
    }
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.description?.toLowerCase().includes(term) ?? false) ||
          s.tags.some((t) => t.toLowerCase().includes(term)),
      );
    }
    if (cat !== "recent") list.sort((a, b) => a.order - b.order);
    return list;
  }, [scenes, recentIds, q, cat]);

  const openDetail = (id: string) => navigate({ to: "/scenes/$sceneId", params: { sceneId: id } });

  return (
    <>
      <PageHeader
        title="Szenen"
        subtitle={`${scenes.length} Szene${scenes.length === 1 ? "" : "n"}`}
        trailing={
          <GlassButton
            variant="ghost"
            size="sm"
            aria-label="Szene hinzufügen"
            onClick={() => {
              const s = sceneManager.create({ name: "Neue Szene" });
              navigate({ to: "/scenes/$sceneId/edit", params: { sceneId: s.id } });
            }}
          >
            <Plus className="h-4 w-4" />
          </GlassButton>
        }
      />

      <div className="mb-3 flex items-center gap-2">
        <div className="glass-card flex flex-1 items-center gap-2 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Szenen suchen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Szenen suchen"
          />
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Kategorien">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={cat === c.id}
            onClick={() => setCat(c.id)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-medium",
              cat === c.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {c.id === "favorites" && <Star className="h-3 w-3" />}
            {c.id === "recent" && <Clock className="h-3 w-3" />}
            {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={scenes.length === 0 ? "Noch keine Szenen" : "Keine Treffer"}
          description={
            scenes.length === 0
              ? "Erstelle Szenen, um mehrere Geräte gleichzeitig zu steuern."
              : "Passe Suche oder Kategorie an, um mehr Szenen zu sehen."
          }
        />
      ) : (
        <motion.div layout className="space-y-2">
          {visible.map((s, i) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <SceneCard scene={s} onOpen={openDetail} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
