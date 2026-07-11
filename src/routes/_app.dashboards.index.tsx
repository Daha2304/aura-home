import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { dashboardManager } from "@/services/dashboards/DashboardManager";

export const Route = createFileRoute("/_app/dashboards/")({
  component: DashboardsIndex,
});

function DashboardsIndex() {
  const navigate = useNavigate();
  const activeId = useDashboardsStore((s) => s.activeId);
  const first = useDashboardsStore((s) => s.order[0]);

  useEffect(() => {
    const target = activeId ?? first ?? dashboardManager.ensureBootstrapDashboard().id;
    navigate({ to: "/dashboards/$dashboardId", params: { dashboardId: target }, replace: true });
  }, [activeId, first, navigate]);

  return (
    <div className="pt-2 text-sm text-muted-foreground">
      Dashboard wird geöffnet …
    </div>
  );
}
