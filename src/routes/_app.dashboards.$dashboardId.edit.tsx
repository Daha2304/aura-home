import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { dashboardManager } from "@/services/dashboards/DashboardManager";
import { EditorTopBar, DashboardCanvas, WidgetToolbox, PropertyEditor } from "@/components/dashboard/editor";
import { registerPlaceholderWidgets } from "@/services/dashboards/editor/PlaceholderWidgets";
import { registerSystemWidgets } from "@/services/widgets/builtin/system";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_app/dashboards/$dashboardId/edit")({
  head: () => ({ meta: [{ title: "Dashboard bearbeiten" }] }),
  component: DashboardEditRoute,
});

function DashboardEditRoute() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardsStore((s) => s.dashboards.get(dashboardId));
  const navigate = useNavigate();

  registerPlaceholderWidgets();
  registerSystemWidgets();

  if (!dashboard) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Dashboard nicht gefunden.
        <button
          className="ml-2 underline"
          onClick={() => {
            const d = dashboardManager.ensureBootstrapDashboard();
            navigate({ to: "/dashboards/$dashboardId/edit", params: { dashboardId: d.id }, replace: true });
          }}
        >
          Erstellen
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 px-2 pt-2 sm:px-4">
        <EditorTopBar dashboard={dashboard} />
        <Link
          to="/dashboards/$dashboardId"
          params={{ dashboardId: dashboard.id }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-md hover:scale-[1.03] active:scale-95"
        >
          <Check className="h-3.5 w-3.5" />
          Fertig
        </Link>
      </div>
      <div className="px-2 py-3 sm:px-4">
        <DashboardCanvas dashboard={dashboard} />
      </div>
      <WidgetToolbox dashboardId={dashboard.id} />
      <PropertyEditor />
    </div>
  );
}
