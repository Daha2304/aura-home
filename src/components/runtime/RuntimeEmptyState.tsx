import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutTemplate, Pencil } from "lucide-react";
import type { DashboardId } from "@/models/dashboard";
import { GlassSurface } from "./glass/GlassSurface";

interface Props {
  dashboardId: DashboardId;
}

export function RuntimeEmptyState({ dashboardId }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-md px-4 pt-2"
    >
      <GlassSurface variant="liquid" radius="2xl" className="w-full p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <LayoutTemplate className="h-10 w-10" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-tight">Dashboard ist leer</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Füge Widgets hinzu, um dein Smart Home in Sekunden im Blick zu haben.
        </p>
        <Link
          to="/dashboards/$dashboardId/edit"
          params={{ dashboardId }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Pencil className="h-4 w-4" />
          Dashboard bearbeiten
        </Link>
      </GlassSurface>
    </motion.div>
  );
}
