import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { dashboardManager } from "@/services/dashboards/DashboardManager";
import { registerSystemWidgets } from "@/services/widgets/builtin/system";
import { ensureRuntimeDefaults } from "@/services/runtime/runtimeDefaults";
import { DashboardRuntime } from "@/components/runtime/DashboardRuntime";

export const Route = createFileRoute("/_app/dashboards/$dashboardId/")({
  head: () => ({ meta: [{ title: "Dashboard · Smart Home" }] }),
  component: DashboardRuntimeRoute,
});

function DashboardRuntimeRoute() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardsStore((s) => s.dashboards.get(dashboardId));
  const navigate = useNavigate();
  const seeded = useRef<string | null>(null);

  useEffect(() => {
    registerSystemWidgets();
  }, []);

  useEffect(() => {
    if (dashboard && seeded.current !== dashboard.id) {
      seeded.current = dashboard.id;
      ensureRuntimeDefaults(dashboard);
    }
  }, [dashboard]);

  useEffect(() => {
    if (!dashboard) {
      const d = dashboardManager.ensureBootstrapDashboard();
      navigate({ to: "/dashboards/$dashboardId", params: { dashboardId: d.id }, replace: true });
    }
  }, [dashboard, navigate]);

  if (!dashboard) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center text-sm text-muted-foreground">
        Dashboard wird vorbereitet …
      </div>
    );
  }
  return <DashboardRuntime dashboard={dashboard} />;
}
