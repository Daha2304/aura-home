import type { WidgetInstance } from "@/models/widgetInstance";
import type { DashboardId } from "@/models/dashboard";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";

interface ClipboardEntry {
  widgets: WidgetInstance[];
  copiedAt: number;
}

class ClipboardImpl {
  private entry: ClipboardEntry | null = null;
  private listeners = new Set<() => void>();

  subscribe(l: () => void): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  private notify() {
    for (const l of this.listeners) l();
  }

  copy(ids: string[]): void {
    const all = useWidgetInstancesStore.getState().instances;
    const widgets = ids.map((id) => all.get(id)).filter((w): w is WidgetInstance => !!w);
    if (widgets.length === 0) return;
    this.entry = { widgets: widgets.map((w) => JSON.parse(JSON.stringify(w)) as WidgetInstance), copiedAt: Date.now() };
    this.notify();
  }

  cut(ids: string[]): void {
    this.copy(ids);
    for (const id of ids) widgetManager.remove(id);
  }

  paste(dashboardId: DashboardId): WidgetInstance[] {
    if (!this.entry) return [];
    const created: WidgetInstance[] = [];
    for (const src of this.entry.widgets) {
      const c = widgetManager.create({
        dashboardId,
        widgetType: src.widgetType,
        overrides: {
          title: src.title,
          subtitle: src.subtitle,
          icon: src.icon,
          layer: src.layer,
          visible: src.visible,
          animation: src.animation,
          styling: { ...src.styling },
          placements: { ...src.placements },
          dataSource: { ...src.dataSource },
          config: { ...src.config },
        },
      });
      if (c) created.push(c);
    }
    return created;
  }

  duplicate(ids: string[]): WidgetInstance[] {
    const created: WidgetInstance[] = [];
    for (const id of ids) {
      const c = widgetManager.duplicate(id);
      if (c) created.push(c);
    }
    return created;
  }

  hasContent(): boolean {
    return !!this.entry;
  }
}

export const editorClipboard = new ClipboardImpl();
