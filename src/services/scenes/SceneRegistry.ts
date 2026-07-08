import type { Scene, SceneCategory } from "@/models/scene";
import { useScenesStore } from "@/store/slices/scenesStore";

/**
 * Read-only, memo-friendly registry facade over the ScenesStore.
 * O(1) lookups, category indexes, and reverse indexes by device/group.
 * The registry does not persist — SceneManager owns writes.
 */
class SceneRegistryImpl {
  get(id: string): Scene | undefined {
    return useScenesStore.getState().byId[id];
  }

  all(): Scene[] {
    return useScenesStore.getState().scenes;
  }

  byCategory(c: SceneCategory): Scene[] {
    const s = useScenesStore.getState();
    return (s.byCategory[c] ?? []).map((id) => s.byId[id]).filter(Boolean) as Scene[];
  }

  byTag(tag: string): Scene[] {
    return this.all().filter((s) => s.tags.includes(tag));
  }

  byDevice(deviceId: string): Scene[] {
    return this.all().filter((s) =>
      s.actions.some((a) => a.deviceId === deviceId),
    );
  }

  byGroup(groupId: string): Scene[] {
    return this.all().filter((s) =>
      s.actions.some((a) => a.groupId === groupId),
    );
  }

  favorites(): Scene[] {
    return this.all().filter((s) => s.favorite);
  }
}

export const sceneRegistry = new SceneRegistryImpl();
