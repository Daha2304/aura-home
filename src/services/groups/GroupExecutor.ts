import { commandQueue } from "@/services/commands/CommandQueue";
import { createId } from "@/utils/ids";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useGroupExecutionsStore } from "@/store/slices/groupExecutionsStore";
import { groupResolver } from "./GroupResolver";
import { groupRegistry } from "./GroupRegistry";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("group-executor");

export interface GroupExecuteResult {
  correlationId: string;
  targeted: string[];
  skipped: string[];
}

/**
 * Fan-out a single group action into individual device commands. Uses
 * exclusively the existing CommandQueue — no side channel, no bespoke
 * retries. Devices without the requested capability are skipped.
 */
class GroupExecutorImpl {
  apply(groupId: string, capabilityId: string, value: unknown): GroupExecuteResult | null {
    const group = groupRegistry.get(groupId);
    if (!group) return null;

    const deviceIds = groupResolver.expand(groupId);
    const devices = useDevicesStore.getState();

    const targeted: string[] = [];
    const skipped: string[] = [];
    for (const id of deviceIds) {
      const d = devices.byId(id);
      if (!d) {
        skipped.push(id);
        continue;
      }
      // A device "supports" a capability if any of its declared capabilities
      // carries this exact id (which is also the wire key).
      const supported = (d.capabilities ?? []).some((c) => c.id === capabilityId);
      if (!supported) {
        skipped.push(id);
        continue;
      }
      targeted.push(id);
    }

    const correlationId = createId("gexec");
    useGroupExecutionsStore.getState().start({
      groupId,
      correlationId,
      capabilityId,
      total: targeted.length,
      completed: 0,
      failed: 0,
      startedAt: Date.now(),
      status: "running",
    });

    for (const id of targeted) {
      commandQueue.enqueue(id, capabilityId, value, {
        optimistic: true,
        correlationId,
      });
    }
    log.info("group apply", groupId, capabilityId, "targeted=", targeted.length, "skipped=", skipped.length);
    return { correlationId, targeted, skipped };
  }

  /** Attach the queue listener that feeds group execution progress. */
  attachToCommandQueue(): () => void {
    const store = useGroupExecutionsStore.getState;
    const offCompleted = commandQueue.on("completed", (c) => {
      if (!c.correlationId) return;
      if (!store().byCorrelation[c.correlationId]) return;
      store().progress(c.correlationId, { completed: 1 });
    });
    const offFailed = commandQueue.on("failed", (c) => {
      if (!c.correlationId) return;
      if (!store().byCorrelation[c.correlationId]) return;
      store().progress(c.correlationId, { failed: 1 });
    });
    return () => {
      offCompleted();
      offFailed();
    };
  }
}

export const groupExecutor = new GroupExecutorImpl();
