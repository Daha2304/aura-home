/**
 * Kleiner, typisierter Event-Emitter. Wird von WebSocketManager, DeviceManager
 * und ErrorBus wiederverwendet, damit wir keine harte Kopplung an ein
 * externes Emitter-Package einschleppen.
 */

export type EventMap = Record<string, unknown>;
export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

export class TypedEmitter<M extends EventMap> {
  private readonly listeners = new Map<keyof M, Set<Listener<unknown>>>();

  on<K extends keyof M>(event: K, listener: Listener<M[K]>): Unsubscribe {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  once<K extends keyof M>(event: K, listener: Listener<M[K]>): Unsubscribe {
    const off = this.on(event, (p) => {
      off();
      listener(p);
    });
    return off;
  }

  off<K extends keyof M>(event: K, listener: Listener<M[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const l of Array.from(set)) {
      try {
        (l as Listener<M[K]>)(payload);
      } catch {
        // Listener-Fehler dürfen den Emitter nicht killen.
      }
    }
  }

  removeAllListeners(event?: keyof M): void {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }
}
