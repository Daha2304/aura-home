import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Search, Workflow, Star, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassButton } from "@/components/glass/GlassButton";
import { AutomationCard } from "@/components/automations/AutomationCard";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { automationManager } from "@/services/automations";
import type { AutomationCategory } from "@/models/automation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/automations")({
  head: () => ({ meta: [{ title: "Automationen · Smart Home" }] }),
  component: AutomationsPage,
});

type Filter = AutomationCategory | "all" | "favorites" | "recent";

const CATEGORIES: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "favorites", label: "Favoriten" },
  { id: "recent", label: "Zuletzt" },
  { id: "presence", label: "Anwesenheit" },
  { id: "time", label: "Zeit" },
  { id: "climate", label: "Klima" },
  { id: "light", label: "Licht" },
  { id: "security", label: "Sicherheit" },
  { id: "media", label: "Medien" },
  { id: "energy", label: "Energie" },
  { id: "notification", label: "Meldungen" },
  { id: "custom", label: "Eigene" },
];

function AutomationsPage() {
  const navigate = useNavigate();
  const automations = useAutomationsStore((s) => s.automations);
  const recentIds = useAutomationsStore((s) => s.recentIds);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Filter>("all");

  const visible = useMemo(() => {
    let list = [...automations].filter((a) => !a.archived);
    if (cat === "favorites") list = list.filter((a) => a.favorite);
    else if (cat === "recent") {
      const order = new Map(recentIds.map((id, i) => [id, i]));
      list = list
        .filter((a) => order.has(a.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    } else if (cat !== "all") {
      list = list.filter((a) => a.category === cat);
    }
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          (a.description?.toLowerCase().includes(term) ?? false) ||
          a.tags.some((t) => t.toLowerCase().includes(term)),
      );
    }
    if (cat !== "recent") list.sort((a, b) => a.order - b.order);
    return list;
  }, [automations, recentIds, q, cat]);

  const openDetail = (id: string) =>
    navigate({ to: "/automations/$automationId", params: { automationId: id } });

  return (
    <>
      <PageHeader
        title="Automationen"
        subtitle={`${automations.length} Regel${automations.length === 1 ? "" : "n"}`}
        trailing={
          <GlassButton
            variant="ghost"
            size="sm"
            aria-label="Automation hinzufügen"
            onClick={() => {
              const a = automationManager.create({ name: "Neue Automation" });
              navigate({ to: "/automations/$automationId/edit", params: { automationId: a.id } });
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
            placeholder="Automationen suchen"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Automationen suchen"
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
              "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-medium",
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
          icon={Workflow}
          title={automations.length === 0 ? "Noch keine Automationen" : "Keine Treffer"}
          description={
            automations.length === 0
              ? "Verknüpfe Auslöser mit Aktionen für dein Zuhause."
              : "Passe Suche oder Kategorie an, um mehr Automationen zu sehen."
          }
        />
      ) : (
        <motion.div layout className="space-y-2">
          {visible.map((a, i) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <AutomationCard automation={a} onOpen={openDetail} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  );
}
