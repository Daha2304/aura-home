import type { Dashboard } from "@/models/dashboard";
import { GlassSurface } from "./glass/GlassSurface";

interface Props {
  dashboard: Dashboard;
}

export function RuntimeHeader({ dashboard }: Props) {
  return (
    <GlassSurface variant="frosted" radius="xl" className="mb-4 px-5 py-4">
      <div className="min-w-0">
        <div className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
          {dashboard.name}
        </div>
        {dashboard.description ? (
          <div className="truncate text-xs text-muted-foreground">{dashboard.description}</div>
        ) : null}
      </div>
    </GlassSurface>
  );
}
