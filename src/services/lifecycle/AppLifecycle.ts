/**
 * AppLifecycle — thin adapter over browser visibility & connectivity events.
 * Emits `app.start`, `app.visible`, `app.hidden`, `app.pause`, `app.resume`,
 * `app.online`, `app.offline` through a typed event emitter (reusing the
 * project's existing TypedEmitter — no new bus).
 */
import { TypedEmitter } from "@/services/events/EventEmitter";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("lifecycle");

interface LifecycleEventMap {
  "app.start": undefined;
  "app.visible": undefined;
  "app.hidden": undefined;
  "app.pause": undefined;
  "app.resume": undefined;
  "app.online": undefined;
  "app.offline": undefined;
}

class LifecycleEmitter extends TypedEmitter<LifecycleEventMap> {}

const emitter = new LifecycleEmitter();

let started = false;
const cleanups: Array<() => void> = [];
let wasHidden = false;

export const appLifecycle = {
  on: emitter.on.bind(emitter),
  off: emitter.off.bind(emitter),
  emit: emitter.emit.bind(emitter),

  start(): void {
    if (started || typeof window === "undefined") return;
    started = true;

    emitter.emit("app.start", undefined);
    log.info("started");

    const onVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      if (hidden) {
        wasHidden = true;
        emitter.emit("app.hidden", undefined);
        emitter.emit("app.pause", undefined);
      } else {
        emitter.emit("app.visible", undefined);
        if (wasHidden) emitter.emit("app.resume", undefined);
        wasHidden = false;
      }
    };
    const onPageShow = () => emitter.emit("app.resume", undefined);
    const onPageHide = () => emitter.emit("app.pause", undefined);
    const onOnline = () => emitter.emit("app.online", undefined);
    const onOffline = () => emitter.emit("app.offline", undefined);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    cleanups.push(
      () => document.removeEventListener("visibilitychange", onVisibility),
      () => window.removeEventListener("pageshow", onPageShow),
      () => window.removeEventListener("pagehide", onPageHide),
      () => window.removeEventListener("online", onOnline),
      () => window.removeEventListener("offline", onOffline),
    );
  },

  stop(): void {
    for (const c of cleanups) c();
    cleanups.length = 0;
    started = false;
  },
};
