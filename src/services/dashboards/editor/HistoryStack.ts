/**
 * History-Stack mit Command-Pattern. Coalescing für kurz aufeinander folgende
 * gleichartige Aktionen (drag/resize).
 */
export interface HistoryCommand {
  kind: string;
  label: string;
  do: () => void;
  undo: () => void;
  /** Optional. Wenn true, wird mit dem vorherigen Command coalesced. */
  coalesceKey?: string;
  createdAt?: number;
}

const COALESCE_MS = 250;

export class HistoryStack {
  private past: HistoryCommand[] = [];
  private future: HistoryCommand[] = [];
  private readonly limit: number;
  private listeners = new Set<() => void>();

  constructor(limit = 100) {
    this.limit = limit;
  }

  subscribe(l: () => void): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  push(cmd: HistoryCommand): void {
    cmd.createdAt = Date.now();
    const prev = this.past[this.past.length - 1];
    if (
      prev &&
      cmd.coalesceKey &&
      prev.coalesceKey === cmd.coalesceKey &&
      cmd.createdAt - (prev.createdAt ?? 0) < COALESCE_MS
    ) {
      // Merge: alte undo bleibt, neue redo wird do
      this.past[this.past.length - 1] = {
        ...prev,
        do: cmd.do,
        createdAt: cmd.createdAt,
      };
    } else {
      this.past.push(cmd);
      if (this.past.length > this.limit) this.past.shift();
    }
    this.future = [];
    this.notify();
  }

  /** Führt do() aus und schiebt in den Stack. */
  execute(cmd: HistoryCommand): void {
    cmd.do();
    this.push(cmd);
  }

  undo(): boolean {
    const cmd = this.past.pop();
    if (!cmd) return false;
    cmd.undo();
    this.future.push(cmd);
    this.notify();
    return true;
  }

  redo(): boolean {
    const cmd = this.future.pop();
    if (!cmd) return false;
    cmd.do();
    this.past.push(cmd);
    this.notify();
    return true;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }
  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.notify();
  }
}

export const editorHistory = new HistoryStack();
