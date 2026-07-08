import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Pencil, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { useUiStore } from "@/store/slices/uiStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useT } from "@/services/i18n/i18n";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [{ title: "Dashboard · Smart Home" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const editing = useUiStore((s) => s.editingDashboard);
  const setEditing = useUiStore((s) => s.setEditingDashboard);
  const status = useConnectionStore((s) => s.status);
  const t = useT();

  return (
    <>
      <PageHeader
        title={t.nav.dashboard}
        subtitle={t.connection[status]}
        trailing={
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setEditing(!editing)}
            className="glass-panel hairline inline-flex h-10 items-center gap-1.5 !rounded-full !p-0 px-3 text-sm font-medium"
            aria-label={editing ? "Bearbeitung beenden" : "Dashboard bearbeiten"}
          >
            {editing ? (
              <>
                <Check className="h-4 w-4" /> Fertig
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" /> Bearbeiten
              </>
            )}
          </motion.button>
        }
      />
      <WidgetGrid />
    </>
  );
}
