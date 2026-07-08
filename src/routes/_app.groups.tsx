import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Layers, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassButton } from "@/components/glass/GlassButton";
import { GroupCard } from "@/components/groups/GroupCard";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { groupManager } from "@/services/groups";
import type { DeviceGroupKind } from "@/models/deviceGroup";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/groups")({
  head: () => ({ meta: [{ title: "Gerätegruppen · Smart Home" }] }),
  component: GroupsPage,
});

const KINDS: Array<{ id: DeviceGroupKind | "all" | "favorites"; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "favorites", label: "Favoriten" },
  { id: "light", label: "Licht" },
  { id: "outlet", label: "Steckdose" },
  { id: "blind", label: "Rollo" },
  { id: "thermostat", label: "Thermostat" },
  { id: "sensor", label: "Sensor" },
  { id: "media", label: "Medien" },
  { id: "mixed", label: "Gemischt" },
  { id: "virtual", label: "Virtuell" },
  { id: "dynamic", label: "Dynamisch" },
];

function GroupsPage() {
  const navigate = useNavigate();
  const groups = useGroupsStore((s) => s.groups);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<typeof KINDS[number]["id"]>("all");

  const visible = useMemo(() => {
    let list = [...groups];
    if (kind === "favorites") list = list.filter((g) => g.favorite);
    else if (kind !== "all") list = list.filter((g) => g.kind === kind);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(term) ||
          g.tags.some((t) => t.toLowerCase().includes(term)),
      );
    }
    list.sort((a, b) => a.order - b.order);
    return list;
  }, [groups, q, kind]);

  const openDetail = (id: string) => navigate({ to: "/groups/$groupId", params: { groupId: id } });

  return (
    <>
      <PageHeader
        title="Gerätegruppen"
        subtitle={`${groups.length} Gruppe${groups.length === 1 ? "" : "n"}`}
        trailing={
          <GlassButton
            variant="ghost"
            size="sm"
            aria-label="Gruppe hinzufügen"
            onClick={() => {
              const g = groupManager.create({ name: "Neue Gruppe" });
              navigate({ to: "/groups/$groupId", params: { groupId: g.id } });
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
            placeholder="Gruppen suchen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Gruppen suchen"
          />
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist">
        {KINDS.map((k) => (
          <button
            key={k.id}
            role="tab"
            aria-selected={kind === k.id}
            onClick={() => setKind(k.id)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-xs font-medium",
              kind === k.id ? "bg-primary text-primary-foreground" : "border border-border bg-background/40 text-muted-foreground",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={groups.length === 0 ? "Keine Gerätegruppen" : "Keine Treffer"}
          description={
            groups.length === 0
              ? "Bündle Geräte oder verschachtele bestehende Gruppen — die Auflösung erfolgt automatisch, Zyklen sind ausgeschlossen."
              : "Passe Suche oder Kategorie an."
          }
        />
      ) : (
        <motion.div layout className="space-y-2">
          {visible.map((g, i) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <GroupCard group={g} onOpen={openDetail} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
