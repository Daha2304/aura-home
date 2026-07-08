import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { searchIndex, type SearchHit } from "./SearchIndex";

/**
 * Baut / aktualisiert den Search-Index über alle Kern-Entities.
 * Aufruf idempotent; Aufrufer entscheiden über Timing.
 */
export class SearchEngine {
  rebuild(): void {
    searchIndex.clear();

    for (const d of useDevicesStore.getState().devices) {
      searchIndex.add({
        id: d.id,
        kind: "device",
        label: d.name,
        aliases: [d.type, d.manufacturer, d.model].filter(Boolean) as string[],
        tags: d.tags,
      });
    }
    for (const r of useRoomsStore.getState().rooms) {
      searchIndex.add({
        id: r.id,
        kind: "room",
        label: r.name,
        aliases: [r.type],
        tags: r.tags,
      });
    }
    try {
      const dashboards = Array.from(useDashboardsStore.getState().dashboards.values());
      for (const db of dashboards) {
        searchIndex.add({
          id: db.id,
          kind: "dashboard",
          label: db.name ?? db.id,
        });
      }
    } catch {
      // dashboards optional
    }

  }

  search(query: string, limit?: number): SearchHit[] {
    return searchIndex.search(query, limit);
  }
}

export const searchEngine = new SearchEngine();
