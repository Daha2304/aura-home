import type { Automation, AutomationCategory } from "@/models/automation";
import { useAutomationsStore } from "@/store/slices/automationsStore";

/**
 * Read-only Facade über den AutomationsStore mit O(1)-Lookup und
 * einigen Rückwärts-Indexen (byDevice/byGroup/byScene/byRoom). Der
 * Store selbst bleibt die Quelle der Wahrheit — der Manager schreibt.
 */
class AutomationRegistryImpl {
  get(id: string): Automation | undefined {
    return useAutomationsStore.getState().byId[id];
  }
  all(): Automation[] {
    return useAutomationsStore.getState().automations;
  }
  byCategory(c: AutomationCategory): Automation[] {
    const s = useAutomationsStore.getState();
    return (s.byCategory[c] ?? []).map((id) => s.byId[id]).filter(Boolean) as Automation[];
  }
  byTag(tag: string): Automation[] {
    return this.all().filter((a) => a.tags.includes(tag));
  }
  favorites(): Automation[] {
    return this.all().filter((a) => a.favorite);
  }
  active(): Automation[] {
    return this.all().filter((a) => a.enabled && !a.archived);
  }
  /** Automationen, die dieses Gerät irgendwo referenzieren. */
  byDevice(deviceId: string): Automation[] {
    return this.all().filter((a) =>
      a.actions.some((x) => (x.config as { deviceId?: string })?.deviceId === deviceId) ||
      a.triggers.some((t) => (t.config as { deviceId?: string })?.deviceId === deviceId),
    );
  }
  byGroup(groupId: string): Automation[] {
    return this.all().filter((a) =>
      a.actions.some((x) => (x.config as { groupId?: string })?.groupId === groupId) ||
      a.triggers.some((t) => (t.config as { groupId?: string })?.groupId === groupId),
    );
  }
  byScene(sceneId: string): Automation[] {
    return this.all().filter((a) =>
      a.actions.some((x) => (x.config as { sceneId?: string })?.sceneId === sceneId) ||
      a.triggers.some((t) => (t.config as { sceneId?: string })?.sceneId === sceneId),
    );
  }
  byRoom(roomId: string): Automation[] {
    return this.all().filter((a) =>
      a.actions.some((x) => (x.config as { roomId?: string })?.roomId === roomId) ||
      a.triggers.some((t) => (t.config as { roomId?: string })?.roomId === roomId),
    );
  }
}

export const automationRegistry = new AutomationRegistryImpl();
