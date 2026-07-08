import type { DashboardId } from "@/models/dashboard";
import type { LayoutBreakpoint } from "@/models/layout";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { useRuntimeStore } from "@/store/slices/runtimeStore";
import { breakpointDetector } from "./BreakpointDetector";
import { runtimeEvents, type RuntimeOverlayId } from "./RuntimeEvents";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("runtime-controller");

/**
 * RuntimeController — koordiniert Dashboard-Aktivierung, Breakpoint und
 * Overlay-State. Kapselt keine Business-Logik und wiederverwendet ausschließlich
 * bestehende Stores + Manager.
 */
class RuntimeControllerImpl {
  private started = false;
  private disposers: Array<() => void> = [];

  start(): void {
    if (this.started) return;
    this.started = true;
    breakpointDetector.start();
    // Initial-Breakpoint spiegeln.
    useRuntimeStore.getState().setBreakpoint(breakpointDetector.get());

    this.disposers.push(
      breakpointDetector.subscribe((bp) => {
        useRuntimeStore.getState().setBreakpoint(bp);
        runtimeEvents.emit("breakpointChanged", { breakpoint: bp });
      }),
    );

    // Overlays aus vorhandenen Stores ableiten.
    this.disposers.push(
      useConnectionStore.subscribe(this.recomputeOverlays),
      useDiscoveryStore.subscribe(this.recomputeOverlays),
    );
    this.recomputeOverlays();

    log.debug("started");
  }

  stop(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
    this.started = false;
  }

  setActiveDashboard(id: DashboardId | null): void {
    useDashboardsStore.getState().setActive(id);
    useRuntimeStore.getState().setActiveDashboard(id);
    runtimeEvents.emit("dashboardChanged", { id });
  }

  setBreakpoint(bp: LayoutBreakpoint): void {
    useRuntimeStore.getState().setBreakpoint(bp);
    runtimeEvents.emit("breakpointChanged", { breakpoint: bp });
  }

  private recomputeOverlays = (): void => {
    const overlays: RuntimeOverlayId[] = [];
    const conn = useConnectionStore.getState();
    const disc = useDiscoveryStore.getState();
    if (conn.status === "disconnected" || conn.status === "error") overlays.push("server-offline");
    if (!conn.authenticated && (conn.status === "connected" || conn.status === "connecting")) overlays.push("auth");
    if (disc.state === "discovering") overlays.push("discovery");
    if (disc.state === "syncing") overlays.push("sync");

    const cur = useRuntimeStore.getState().overlays;
    if (cur.length === overlays.length && cur.every((o: RuntimeOverlayId, i: number) => o === overlays[i])) return;
    useRuntimeStore.getState().setOverlays(overlays);
    runtimeEvents.emit("overlayChanged", { overlays });
  };
}

export const runtimeController = new RuntimeControllerImpl();
