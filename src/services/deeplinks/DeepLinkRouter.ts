/**
 * DeepLinkRouter — parses `smarthome://<kind>/<id>` (and `web+smarthome://`)
 * URLs to internal TanStack routes. Handlers are pluggable via `register`.
 */
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("deeplink");

export type DeepLinkResolver = (id: string) => { to: string; params?: Record<string, string> } | null;

const resolvers = new Map<string, DeepLinkResolver>();

function defaultResolvers(): void {
  resolvers.set("device", (id) => ({ to: "/devices/$deviceId", params: { deviceId: id } }));
  resolvers.set("room", (id) => ({ to: "/rooms/$roomId", params: { roomId: id } }));
  resolvers.set("scene", (id) => ({ to: "/scenes/$sceneId", params: { sceneId: id } }));
  resolvers.set("group", (id) => ({ to: "/groups/$groupId", params: { groupId: id } }));
  resolvers.set("automation", (id) => ({ to: "/automations/$automationId", params: { automationId: id } }));
  resolvers.set("dashboard", (id) => ({ to: "/dashboards/$dashboardId", params: { dashboardId: id } }));
}

export interface ParsedDeepLink {
  kind: string;
  id: string;
  target: { to: string; params?: Record<string, string> };
}

let started = false;

export const deepLinkRouter = {
  start(): void {
    if (started) return;
    started = true;
    if (resolvers.size === 0) defaultResolvers();

    if (typeof window !== "undefined") {
      // Handle protocol-handler forwarded via ?deeplink=... at start_url.
      try {
        const url = new URL(window.location.href);
        const dl = url.searchParams.get("deeplink");
        if (dl) {
          const parsed = deepLinkRouter.parse(dl);
          if (parsed) {
            window.sessionStorage?.setItem(
              "smarthome.deeplink.pending",
              JSON.stringify(parsed),
            );
          }
          url.searchParams.delete("deeplink");
          window.history.replaceState({}, "", url.toString());
        }
      } catch { /* ignore */ }

      // Register protocol handler in prod only.
      if (import.meta.env.PROD) {
        try {
          navigator.registerProtocolHandler?.("web+smarthome", "/?deeplink=%s");
        } catch (err) {
          log.debug("protocol handler registration failed", err);
        }
      }
    }
  },

  stop(): void {
    started = false;
  },

  register(kind: string, resolver: DeepLinkResolver): () => void {
    resolvers.set(kind, resolver);
    return () => resolvers.delete(kind);
  },

  parse(input: string): ParsedDeepLink | null {
    try {
      const raw = decodeURIComponent(input);
      const m = raw.match(/^(?:web\+)?smarthome:\/\/([^/]+)\/(.+)$/i);
      if (!m) return null;
      const kind = m[1].toLowerCase();
      const id = m[2].replace(/\/+$/, "");
      const resolver = resolvers.get(kind);
      if (!resolver) return null;
      const target = resolver(id);
      if (!target) return null;
      return { kind, id, target };
    } catch { return null; }
  },

  consumePending(): ParsedDeepLink | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage?.getItem("smarthome.deeplink.pending");
    if (!raw) return null;
    window.sessionStorage.removeItem("smarthome.deeplink.pending");
    try { return JSON.parse(raw) as ParsedDeepLink; } catch { return null; }
  },
};
