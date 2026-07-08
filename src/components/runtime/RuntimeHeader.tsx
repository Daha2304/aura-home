import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import type { Dashboard } from "@/models/dashboard";
import { GlassSurface } from "./glass/GlassSurface";

interface Props {
  dashboard: Dashboard;
}

export function RuntimeHeader({ dashboard }: Props) {
  return (
    <GlassSurface
      variant="frosted"
      radius="xl"
      className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:flex sm:justify-between"
    >
      <div className="min-w-0">
        <div className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {dashboard.name}
        </div>
        {dashboard.description ? (
          <div className="truncate text-xs text-muted-foreground">{dashboard.description}</div>
        ) : null}
      </div>
      <Link
        to="/dashboards/$dashboardId/edit"
        params={{ dashboardId: dashboard.id }}
        aria-label="Dashboard bearbeiten"
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-glass-border/60 bg-surface/60 px-4 py-2 text-xs font-medium backdrop-blur-md transition-transform hover:scale-[1.03] active:scale-95"
      >
        <Pencil className="h-3.5 w-3.5" />
        Bearbeiten
      </Link>
    </GlassSurface>
  );
}
