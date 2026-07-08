import { Reorder, motion } from "framer-motion";
import { useDashboardStore } from "@/store/slices/dashboardStore";
import { useUiStore } from "@/store/slices/uiStore";
import { WidgetContainer } from "./WidgetContainer";
import type { Widget } from "@/models/widget";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function WidgetGrid() {
  const widgets = useDashboardStore((s) => s.widgets);
  const setWidgets = useDashboardStore((s) => s.setWidgets);
  const toggleWidget = useDashboardStore((s) => s.toggleWidget);
  const editing = useUiStore((s) => s.editingDashboard);

  const sorted = [...widgets].sort((a, b) => a.order - b.order);
  const visible = editing ? sorted : sorted.filter((w) => w.visible);

  if (!editing) {
    return (
      <div className="space-y-6">
        {visible.map((w) => (
          <WidgetContainer key={w.id} type={w.type} />
        ))}
      </div>
    );
  }

  const handleReorder = (newOrder: Widget[]) => {
    setWidgets(newOrder.map((w, order) => ({ ...w, order })));
  };

  return (
    <Reorder.Group axis="y" values={sorted} onReorder={handleReorder} className="space-y-3">
      {sorted.map((w) => (
        <Reorder.Item key={w.id} value={w} className="list-none">
          <motion.div
            layout
            className={cn(
              "glass-panel flex items-center gap-3 !p-3",
              !w.visible && "opacity-60",
            )}
          >
            <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold capitalize">{w.type}</div>
              <div className="text-xs text-muted-foreground">Größe: {w.size}</div>
            </div>
            <button
              type="button"
              onClick={() => toggleWidget(w.id)}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-foreground"
              aria-label={w.visible ? "Widget ausblenden" : "Widget einblenden"}
            >
              {w.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </motion.div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
