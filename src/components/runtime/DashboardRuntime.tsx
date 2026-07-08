import { useEffect } from "react";
import type { Dashboard } from "@/models/dashboard";
import { RuntimeHeader } from "./RuntimeHeader";
import { RuntimeCanvas } from "./RuntimeCanvas";
import { OverlayLayer } from "./overlays/OverlayLayer";
import { useRuntimeTheme } from "@/hooks/runtime/useRuntimeTheme";
import { runtimeController } from "@/services/runtime/RuntimeController";
import { registerSystemWidgets } from "@/services/widgets/builtin/system";

interface Props {
  dashboard: Dashboard;
}

/**
 * Wurzelkomponente der Runtime — read-only Dashboard-Ansicht.
 * Verwendet ausschließlich Runtime-Komponenten, keine Editor-Bausteine.
 */
export function DashboardRuntime({ dashboard }: Props) {
  useRuntimeTheme();

  useEffect(() => {
    registerSystemWidgets();
    runtimeController.start();
    runtimeController.setActiveDashboard(dashboard.id);
  }, [dashboard.id]);

  return (
    <div className="relative w-full">
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5">
        <RuntimeHeader dashboard={dashboard} />
        <RuntimeCanvas dashboard={dashboard} />
      </div>
      <OverlayLayer />
    </div>
  );
}
