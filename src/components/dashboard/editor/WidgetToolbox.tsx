import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Plus } from "lucide-react";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";
import { useEditorStore } from "@/store/slices/editorStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { editorHistory } from "@/services/dashboards/editor/HistoryStack";
import { layoutEngine } from "@/services/dashboards/LayoutEngine";
import { ALL_WIDGET_CATEGORIES } from "@/models/widgetCategory";
import type { WidgetCategory } from "@/models/widgetCategory";
import type { WidgetDescriptor } from "@/models/widgetDescriptor";
import type { DashboardId } from "@/models/dashboard";
import { cn } from "@/lib/utils";
import { springSoft } from "@/themes/motion";

interface Props {
  dashboardId: DashboardId;
}

export function WidgetToolbox({ dashboardId }: Props) {
  const open = useEditorStore((s) => s.toolboxOpen);
  const setOpen = useEditorStore((s) => s.setToolboxOpen);
  const bp = useEditorStore((s) => s.activeBreakpoint);
  const all = useWidgetRegistryStore((s) => s.descriptors);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<WidgetCategory | "all">("all");

  const filtered = useMemo(() => {
    return all.filter((d) => {
      if (cat !== "all" && d.category !== cat) return false;
      if (query && !`${d.name} ${d.description} ${d.id}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [all, cat, query]);

  const addWidget = (d: WidgetDescriptor) => {
    useLayoutsStore.getState().ensure(dashboardId);
    const grid = useLayoutsStore.getState().getGrid(dashboardId, bp);
    if (!grid) return;
    const placement = layoutEngine.defaultPlacementFor(grid, d);
    const created = widgetManager.create({
      dashboardId,
      widgetType: d.id,
      overrides: { placements: { [bp]: placement } },
    });
    if (!created) return;
    widgetManager.move(created.id, bp, placement);
    editorHistory.push({
      kind: "create",
      label: "Widget hinzufügen",
      do: () => {
        widgetManager.create({
          dashboardId,
          widgetType: d.id,
          overrides: { placements: { [bp]: placement } },
        });
      },
      undo: () => widgetManager.remove(created.id),
    });
    useEditorStore.getState().select(created.id);
  };

  const categories: Array<WidgetCategory | "all"> = ["all", ...ALL_WIDGET_CATEGORIES];

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={springSoft}
          className="fixed right-0 top-0 z-40 flex h-full w-[340px] max-w-[92vw] flex-col gap-3 border-l border-border/40 bg-background/85 p-4 backdrop-blur-2xl"
        >
          <header className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Widgets</div>
              <div className="text-xs text-muted-foreground">Ziehe oder tippe zum Hinzufügen</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen …"
              className="glass-panel hairline w-full !rounded-full !p-0 py-2 pl-10 pr-4 text-sm outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  cat === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-[hsl(var(--foreground)/0.06)] text-muted-foreground hover:bg-[hsl(var(--foreground)/0.1)]",
                )}
              >
                {c === "all" ? "Alle" : c}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {filtered.map((d) => (
              <motion.button
                key={d.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => addWidget(d)}
                className="glass-panel hairline flex w-full items-start gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-[hsl(var(--foreground)/0.04)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <span className="rounded-full bg-[hsl(var(--foreground)/0.06)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {d.category}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{d.description}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {d.defaultSize.w}×{d.defaultSize.h}
                  </div>
                </div>
              </motion.button>
            ))}
            {filtered.length === 0 && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Keine Widgets gefunden.
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
