import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Undo2,
  Redo2,
  Grid3x3,
  Magnet,
  Ruler,
  Plus,
  Download,
  Upload,
  Check,
  Pencil,
  Sliders,
} from "lucide-react";
import { useEditorStore } from "@/store/slices/editorStore";
import { useDashboardEditor } from "@/hooks/useDashboardEditor";
import { dashboardManager } from "@/services/dashboards/DashboardManager";
import type { Dashboard } from "@/models/dashboard";
import { BreakpointSwitcher } from "./BreakpointSwitcher";
import { ZoomControl } from "./ZoomControl";

interface Props {
  dashboard: Dashboard;
}

export function EditorTopBar({ dashboard }: Props) {
  const mode = useEditorStore((s) => s.mode);
  const toggle = useEditorStore((s) => s.toggleMode);
  const showGrid = useEditorStore((s) => s.showGrid);
  const showGuides = useEditorStore((s) => s.showGuides);
  const showSpacing = useEditorStore((s) => s.showSpacing);
  const setToolboxOpen = useEditorStore((s) => s.setToolboxOpen);
  const setPropertiesOpen = useEditorStore((s) => s.setPropertiesOpen);
  const toolboxOpen = useEditorStore((s) => s.toolboxOpen);
  const propsOpen = useEditorStore((s) => s.propertiesOpen);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const toggleGuides = useEditorStore((s) => s.toggleGuides);
  const toggleSpacing = useEditorStore((s) => s.toggleSpacing);

  const editor = useDashboardEditor(dashboard.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const data = editor.exportDashboard();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dashboard.name.replace(/\s+/g, "-").toLowerCase()}.dashboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      dashboardManager.import(JSON.parse(text));
    } catch {
      // errorBus wird intern von dashboardManager.import befeuert
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const iconBtn = "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors";
  const active = "bg-primary text-primary-foreground";
  const inactive = "hover:bg-[hsl(var(--foreground)/0.06)]";

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border/30 bg-background/70 px-3 py-2 backdrop-blur-2xl">
      <div className="flex items-center gap-2">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{dashboard.name}</div>
          <div className="text-xs text-muted-foreground">
            {mode === "edit" ? "Bearbeitungsmodus" : dashboard.description ?? "Ansichtsmodus"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mode === "edit" && (
          <>
            <div className="glass-panel hairline flex items-center gap-0.5 !rounded-full !p-1">
              <button onClick={() => editor.undo()} disabled={!editor.canUndo} className={`${iconBtn} disabled:opacity-40 ${inactive}`} aria-label="Rückgängig">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={() => editor.redo()} disabled={!editor.canRedo} className={`${iconBtn} disabled:opacity-40 ${inactive}`} aria-label="Wiederherstellen">
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <BreakpointSwitcher />
            <ZoomControl />

            <div className="glass-panel hairline flex items-center gap-0.5 !rounded-full !p-1">
              <button onClick={toggleGrid} className={`${iconBtn} ${showGrid ? active : inactive}`} aria-label="Raster">
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button onClick={toggleGuides} className={`${iconBtn} ${showGuides ? active : inactive}`} aria-label="Hilfslinien">
                <Magnet className="h-4 w-4" />
              </button>
              <button onClick={toggleSpacing} className={`${iconBtn} ${showSpacing ? active : inactive}`} aria-label="Abstände">
                <Ruler className="h-4 w-4" />
              </button>
            </div>

            <div className="glass-panel hairline flex items-center gap-0.5 !rounded-full !p-1">
              <button onClick={onExport} className={`${iconBtn} ${inactive}`} aria-label="Exportieren">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => fileRef.current?.click()} className={`${iconBtn} ${inactive}`} aria-label="Importieren">
                <Upload className="h-4 w-4" />
              </button>
              <input ref={fileRef} type="file" accept="application/json" onChange={onImportFile} className="hidden" />
            </div>

            <button
              onClick={() => setPropertiesOpen(!propsOpen)}
              className={`glass-panel hairline ${iconBtn} !rounded-full !p-0 ${propsOpen ? active : inactive}`}
              aria-label="Eigenschaften"
            >
              <Sliders className="h-4 w-4" />
            </button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setToolboxOpen(!toolboxOpen)}
              className="glass-panel hairline inline-flex h-9 items-center gap-1.5 !rounded-full !p-0 px-3 text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Widget
            </motion.button>
          </>
        )}

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={toggle}
          className="glass-panel hairline inline-flex h-9 items-center gap-1.5 !rounded-full !p-0 px-3 text-sm font-medium"
          aria-label={mode === "edit" ? "Fertig" : "Bearbeiten"}
        >
          {mode === "edit" ? (
            <>
              <Check className="h-4 w-4" /> Fertig
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" /> Bearbeiten
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
