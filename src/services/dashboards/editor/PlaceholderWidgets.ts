import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import type { WidgetCategory } from "@/models/widgetCategory";

/**
 * Registriert generische Layout-Platzhalter, damit der Editor visuell
 * arbeitsfähig ist, obwohl noch keine echten Smart-Home-Widgets existieren.
 * Idempotent — mehrfacher Aufruf ist unschädlich.
 */
let registered = false;

export function registerPlaceholderWidgets(): void {
  if (registered) return;
  registered = true;

  const cats: Array<{ id: string; name: string; category: WidgetCategory; icon: string; size: { w: number; h: number }; min: { w: number; h: number }; max: { w: number; h: number } }> = [
    { id: "placeholder.mini", name: "Mini", category: "system", icon: "square", size: { w: 2, h: 2 }, min: { w: 1, h: 1 }, max: { w: 4, h: 3 } },
    { id: "placeholder.tile", name: "Tile", category: "system", icon: "layout-grid", size: { w: 3, h: 3 }, min: { w: 2, h: 2 }, max: { w: 6, h: 6 } },
    { id: "placeholder.card", name: "Card", category: "system", icon: "credit-card", size: { w: 4, h: 3 }, min: { w: 2, h: 2 }, max: { w: 8, h: 6 } },
    { id: "placeholder.wide", name: "Wide", category: "system", icon: "rectangle-horizontal", size: { w: 6, h: 2 }, min: { w: 3, h: 1 }, max: { w: 16, h: 4 } },
    { id: "placeholder.tall", name: "Tall", category: "system", icon: "rectangle-vertical", size: { w: 2, h: 5 }, min: { w: 1, h: 3 }, max: { w: 4, h: 10 } },
    { id: "placeholder.hero", name: "Hero", category: "system", icon: "sparkle", size: { w: 8, h: 4 }, min: { w: 4, h: 2 }, max: { w: 16, h: 8 } },
  ];

  for (const c of cats) {
    widgetRegistry.register(
      defineWidget({
        id: c.id,
        name: c.name,
        category: c.category,
        description: `Layout-Platzhalter (${c.name}). Wird durch echte Widgets ersetzt.`,
        icon: c.icon,
        defaultSize: c.size,
        minSize: c.min,
        maxSize: c.max,
        supportedLayouts: [
          "phone-portrait",
          "phone-landscape",
          "tablet-portrait",
          "tablet-landscape",
          "desktop",
        ],
        settings: [],
        capabilities: ["resizable", "movable", "themeable", "configurable"],
        version: 1,
      }),
    );
  }
}
