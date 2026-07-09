import type { MetricContributor } from "../MetricContributors";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { useAutomationExecutionsStore } from "@/store/slices/automationExecutionsStore";

/**
 * Automation Contributor — pro Raum: Anzahl aktiver + laufender
 * Automationen, die mindestens ein Gerät dieses Raums referenzieren.
 * Läuft komplett zusätzlich zu bestehenden Aggregatoren.
 */
export const automationContributor: MetricContributor = {
  id: "automations",
  reset(acc) {
    acc.automationCount = 0;
    acc.automationsRunning = 0;
  },
  contribute({ device, acc }) {
    if (!device.roomId) return;
    const automations = useAutomationsStore.getState().automations;
    for (const a of automations) {
      if (!a.enabled || a.archived) continue;
      const uses = a.actions.some(
        (x) => (x.config as { deviceId?: string })?.deviceId === device.id,
      ) || a.triggers.some(
        (t) => (t.config as { deviceId?: string })?.deviceId === device.id,
      );
      if (uses) acc.automationCount = (acc.automationCount ?? 0) + 1;
    }
    const running = useAutomationExecutionsStore.getState().active;
    for (const exec of running) {
      const a = useAutomationsStore.getState().byId[exec.automationId];
      if (!a) continue;
      const uses = a.actions.some(
        (x) => (x.config as { deviceId?: string })?.deviceId === device.id,
      );
      if (uses) acc.automationsRunning = (acc.automationsRunning ?? 0) + 1;
    }
  },
};
