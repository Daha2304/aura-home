import { createFileRoute } from "@tanstack/react-router";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { dashboardManager } from "@/services/dashboards/DashboardManager";
import { EditorTopBar, DashboardCanvas, WidgetToolbox, PropertyEditor } from "@/components/dashboard/editor";
import { registerPlaceholderWidgets } from "@/services/dashboards/editor/PlaceholderWidgets";

export const Route = createFileRoute("/_app/dashboards/$dashboardId")({
  head: () => ({ meta: [{ title: "Dashboard · Smart Home" }] }),
  component: DashboardDetailPage,
});

function DashboardDetailPage() {
  const { dashboardId } = Route.useParams();
  const dashboard = useDashboardsStore((s) => s.dashboards.get(dashboardId));

  // Sicherstellen, dass Platzhalter-Widgets in der Registry vorhanden sind.
  registerPlaceholderWidgets();

  if (!dashboard) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Dashboard nicht gefunden.
        <button
          className="ml-2 underline"
          onClick={() => {
            const d = dashboardManager.ensureBootstrapDashboard();
            window.history.replaceState(null, "", `/dashboards/${d.id}`);
          }}
        >
          Erstellen
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <EditorTopBar dashboard={dashboard} />
      <div className="px-2 py-3 sm:px-4">
        <DashboardCanvas dashboard={dashboard} />
      </div>
      <WidgetToolbox dashboardId={dashboard.id} />
      <PropertyEditor />
    </div>
  );
}
