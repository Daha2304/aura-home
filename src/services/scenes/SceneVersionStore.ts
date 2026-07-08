import type { Scene } from "@/models/scene";
import type { SceneVersion } from "@/models/sceneVersion";
import { useSceneVersionsStore } from "@/store/slices/sceneVersionsStore";
import { createId } from "@/utils/ids";

const MAX_VERSIONS = 20;
const STORAGE_KEY = "scene.versions.v1";

function readJson<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

/**
 * Bounded ring buffer of scene snapshots, persisted to localStorage.
 * Undo functionality reads from here; export can pin a version.
 */
class SceneVersionStoreImpl {
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const stored = readJson<Record<string, SceneVersion[]>>(STORAGE_KEY);
    if (stored && typeof stored === "object") {
      const state = useSceneVersionsStore.getState();
      for (const [sceneId, versions] of Object.entries(stored)) {
        for (const v of versions) state.add(v, MAX_VERSIONS);
        // Note: we add in order — most recent first is preserved because
        // add() unshifts. If persisted order is oldest-first, adjust:
      }
    }
    useSceneVersionsStore.subscribe((s) => {
      writeJson(STORAGE_KEY, s.byScene);
    });
  }

  snapshot(scene: Scene, createdBy?: string): SceneVersion {
    const { version: _v, ...payload } = scene;
    void _v;
    const entry: SceneVersion = {
      id: createId("sver"),
      sceneId: scene.id,
      versionNumber: scene.version,
      createdAt: Date.now(),
      createdBy,
      payload,
    };
    useSceneVersionsStore.getState().add(entry, MAX_VERSIONS);
    return entry;
  }

  list(sceneId: string): SceneVersion[] {
    return useSceneVersionsStore.getState().list(sceneId);
  }

  clear(sceneId: string): void {
    useSceneVersionsStore.getState().clear(sceneId);
  }
}

export const sceneVersionStore = new SceneVersionStoreImpl();
