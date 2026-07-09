/**
 * Built-in Health Checks — thin adapter über bestehende Systeme.
 * Keine Reparatur, nur Read-only Diagnose.
 */
import { healthCheckRegistry } from "./HealthManager";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useOfflineStore } from "@/store/slices/offlineStore";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";
import { useVersionStore } from "@/services/version/VersionManager";
import { useUpdateStore } from "@/store/slices/updateStore";

export function registerBuiltinHealthChecks(): void {
  healthCheckRegistry.register({
    id: "core.websocket",
    label: "WebSocket-Verbindung",
    category: "network",
    run: () => {
      const s = useConnectionStore.getState();
      if (s.status === "connected" && s.authenticated) {
        return {
          status: "ok",
          detail: `verbunden${s.latencyMs != null ? ` · ${s.latencyMs} ms` : ""}`,
        };
      }
      if (s.status === "connecting" || s.status === "reconnecting") {
        return { status: "warn", detail: `Status: ${s.status}` };
      }
      return { status: "fail", detail: `Status: ${s.status}` };
    },
  });

  healthCheckRegistry.register({
    id: "core.offline",
    label: "Offline-Status",
    category: "network",
    run: () => {
      const online = useOfflineStore.getState().online;
      return online
        ? { status: "ok", detail: "online" }
        : { status: "warn", detail: "offline" };
    },
  });

  healthCheckRegistry.register({
    id: "registry.widgets",
    label: "Widget Registry",
    category: "registry",
    run: () => {
      const count = useWidgetRegistryStore.getState().descriptors.length;
      if (count === 0) return { status: "fail", detail: "keine Widgets registriert" };
      return { status: "ok", detail: `${count} Widgets`, metrics: { count } };
    },
  });

  healthCheckRegistry.register({
    id: "runtime.version",
    label: "Datenmodell-Version",
    category: "core",
    run: () => {
      const v = useVersionStore.getState();
      return {
        status: "ok",
        detail: `App ${v.appVersion} · Data v${v.dataModelVersion}`,
        metrics: {
          app: v.appVersion,
          dataModel: v.dataModelVersion,
          cache: v.cacheVersion,
          backup: v.backupVersion,
        },
      };
    },
  });

  healthCheckRegistry.register({
    id: "runtime.serviceworker",
    label: "Service Worker",
    category: "runtime",
    run: async () => {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
        return { status: "warn", detail: "nicht verfügbar" };
      }
      const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
      const state = useUpdateStore.getState();
      if (!reg) return { status: "warn", detail: "nicht registriert" };
      return {
        status: "ok",
        detail: state.available ? "Update verfügbar" : "aktiv",
      };
    },
  });

  healthCheckRegistry.register({
    id: "runtime.storage",
    label: "Speicherkontingent",
    category: "storage",
    run: async () => {
      if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
        return { status: "warn", detail: "nicht verfügbar" };
      }
      const est = await navigator.storage.estimate();
      const used = est.usage ?? 0;
      const quota = est.quota ?? 0;
      const pct = quota > 0 ? Math.round((used / quota) * 100) : 0;
      const status = pct > 90 ? "warn" : "ok";
      return {
        status,
        detail: `${(used / 1024 / 1024).toFixed(1)} MB von ${(quota / 1024 / 1024).toFixed(0)} MB (${pct}%)`,
        metrics: { used, quota, percent: pct },
      };
    },
  });
}
