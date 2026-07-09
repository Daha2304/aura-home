/**
 * OfflineEngine — reads existing connectivity, does NOT own its own queue.
 *
 * The existing `CommandQueue` and `wsManager` remain the single source of
 * truth for commands. The engine only:
 *   - tracks online/offline transitions,
 *   - mirrors CommandsStore pending count into offlineStore,
 *   - re-triggers connection + flush on reconnect (via wsManager).
 *
 * Retry / conflict resolution are prepared as descriptor types (see
 * `ConflictResolutionDescriptor`) but no business logic ships here.
 */
import { createLogger } from "@/services/logger/Logger";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { useCommandsStore } from "@/store/slices/commandsStore";
import { useOfflineStore } from "@/store/slices/offlineStore";

const log = createLogger("offline");

export interface ConflictResolutionDescriptor<T = unknown> {
  id: string;
  label: string;
  resolve(local: T, remote: T): T | Promise<T>;
}

class ConflictRegistry {
  private readonly entries = new Map<string, ConflictResolutionDescriptor>();
  register<T>(d: ConflictResolutionDescriptor<T>): void {
    this.entries.set(d.id, d as ConflictResolutionDescriptor);
  }
  get(id: string): ConflictResolutionDescriptor | undefined {
    return this.entries.get(id);
  }
  list(): ConflictResolutionDescriptor[] {
    return Array.from(this.entries.values());
  }
}

export const conflictRegistry = new ConflictRegistry();

let started = false;
const unsubs: Array<() => void> = [];

function readPendingCount(): number {
  const state = useCommandsStore.getState() as Record<string, unknown>;
  const commands = (state.commands ?? state.items ?? []) as Array<{ state?: string }>;
  if (!Array.isArray(commands)) return 0;
  return commands.filter((c) => c.state === "queued" || c.state === "pending" || c.state === "in-flight").length;
}

function refreshPending(): void {
  useOfflineStore.getState().setPendingCount(readPendingCount());
}

export const offlineEngine = {
  start(): void {
    if (started || typeof window === "undefined") return;
    started = true;

    const setOnline = (v: boolean) => useOfflineStore.getState().setOnline(v);
    setOnline(navigator.onLine);

    const on = () => {
      setOnline(true);
      log.info("network online");
      // Nudge the existing communication layer — no parallel logic.
      void wsManager.connect().catch(() => {});
    };
    const off = () => {
      setOnline(false);
      log.info("network offline");
    };

    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    unsubs.push(() => window.removeEventListener("online", on));
    unsubs.push(() => window.removeEventListener("offline", off));

    // Mirror pending commands.
    refreshPending();
    const unsubCommands = useCommandsStore.subscribe(() => refreshPending());
    unsubs.push(unsubCommands);
  },

  stop(): void {
    for (const u of unsubs) u();
    unsubs.length = 0;
    started = false;
  },

  isOnline(): boolean {
    return useOfflineStore.getState().online;
  },
};
