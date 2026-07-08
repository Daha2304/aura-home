import { createFileRoute } from "@tanstack/react-router";
import { Plus, Workflow } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { AutomationCard } from "@/components/automations/AutomationCard";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassButton } from "@/components/glass/GlassButton";

export const Route = createFileRoute("/_app/automations")({
  head: () => ({ meta: [{ title: "Automationen · Smart Home" }] }),
  component: AutomationsPage,
});

function AutomationsPage() {
  const automations = useAutomationsStore((s) => s.automations);
  return (
    <>
      <PageHeader
        title="Automationen"
        subtitle={`${automations.length} Regel${automations.length === 1 ? "" : "n"}`}
        trailing={
          <GlassButton variant="ghost" size="sm" aria-label="Automation hinzufügen">
            <Plus className="h-4 w-4" />
          </GlassButton>
        }
      />
      {automations.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Noch keine Automationen"
          description="Verknüpfe Auslöser mit Aktionen für dein Zuhause."
        />
      ) : (
        <div className="space-y-2">
          {automations.map((a) => (
            <AutomationCard key={a.id} automation={a} />
          ))}
        </div>
      )}
    </>
  );
}
