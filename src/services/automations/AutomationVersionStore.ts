import type { Automation } from "@/models/automation";
import type { AutomationVersion } from "@/models/automationVersion";
import { useAutomationVersionsStore } from "@/store/slices/automationVersionsStore";
import { readJson, writeJson } from "@/services/storage/localStorage";
import { createId } from "@/utils/ids";

const MAX_VERSIONS = 20;
const STORAGE_KEY = "automation.versions.v1";

class AutomationVersionStoreImpl {
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const stored = readJson<Record<string, AutomationVersion[]>>(STORAGE_KEY);
    if (stored && typeof stored === "object") {
      useAutomationVersionsStore.getState().setAll(stored);
    }
    useAutomationVersionsStore.subscribe((s) => {
      writeJson(STORAGE_KEY, s.byAutomation);
    });
  }

  snapshot(automation: Automation, createdBy?: string): AutomationVersion {
    const { version: _v, ...payload } = automation;
    void _v;
    const entry: AutomationVersion = {
      id: createId("aver"),
      automationId: automation.id,
      versionNumber: automation.version,
      createdAt: Date.now(),
      createdBy,
      payload,
    };
    useAutomationVersionsStore.getState().add(entry, MAX_VERSIONS);
    return entry;
  }

  list(automationId: string): AutomationVersion[] {
    return useAutomationVersionsStore.getState().list(automationId);
  }

  clear(automationId: string): void {
    useAutomationVersionsStore.getState().clear(automationId);
  }
}

export const automationVersionStore = new AutomationVersionStoreImpl();
