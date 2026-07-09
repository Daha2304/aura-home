import type {
  SearchContext,
  SearchResult,
} from "@/models/search";
import type { SearchProviderDescriptor } from "@/models/searchProvider";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { useUsersStore } from "@/store/slices/usersStore";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { useTimelineStore } from "@/store/slices/timelineStore";
import { useNotificationsStore } from "@/store/slices/notificationsStore";

/**
 * Built-in search providers. Each provider is a thin adapter over the
 * corresponding domain store/registry — no parallel data model.
 */

function matches(hay: string, q: string): boolean {
  if (!q) return true;
  return hay.toLowerCase().includes(q.toLowerCase());
}

function relevance(title: string, q: string): number {
  if (!q) return 0.4;
  const t = title.toLowerCase();
  const query = q.toLowerCase();
  if (t === query) return 1;
  if (t.startsWith(query)) return 0.9;
  if (t.includes(` ${query}`)) return 0.75;
  if (t.includes(query)) return 0.6;
  return 0.3;
}

// ---------------- Devices ----------------
export const devicesProvider: SearchProviderDescriptor = {
  id: "search.provider.devices",
  label: "Geräte",
  category: "device",
  icon: "cpu",
  priority: 90,
  permissionResource: "device",
  search: (ctx: SearchContext) => {
    const q = ctx.query;
    const devices = useDevicesStore.getState().devices;
    const rooms = useRoomsStore.getState().byId;
    const out: SearchResult[] = [];
    for (const d of devices) {
      const hay = `${d.name} ${d.type} ${d.category ?? ""}`;
      if (!matches(hay, q)) continue;
      const room = d.roomId ? rooms[d.roomId]?.name : undefined;
      out.push({
        id: `device:${d.id}`,
        providerId: devicesProvider.id,
        category: "device",
        type: "entity",
        title: d.name,
        subtitle: [d.type, room].filter(Boolean).join(" · "),
        icon: d.icon ?? "cpu",
        color: d.color,
        relevance: relevance(d.name, q),
        priority: d.favorite ? 6 : 3,
        permission: { resource: "device", action: "read", refId: d.id },
        navigateTo: `/devices/${d.id}`,
        ref: { refType: "device", refId: d.id },
      });
    }
    return out;
  },
};

// ---------------- Rooms ----------------
export const roomsProvider: SearchProviderDescriptor = {
  id: "search.provider.rooms",
  label: "Räume",
  category: "room",
  icon: "layout-grid",
  priority: 85,
  permissionResource: "room",
  search: (ctx) => {
    const q = ctx.query;
    const rooms = useRoomsStore.getState().rooms;
    return rooms
      .filter((r) => matches(`${r.name} ${r.type ?? ""}`, q))
      .map<SearchResult>((r) => ({
        id: `room:${r.id}`,
        providerId: roomsProvider.id,
        category: "room",
        type: "entity",
        title: r.name,
        subtitle: r.type,
        icon: r.icon ?? "layout-grid",
        color: r.color,
        relevance: relevance(r.name, q),
        priority: r.favorite ? 6 : 3,
        permission: { resource: "room", action: "read", refId: r.id },
        navigateTo: `/rooms/${r.id}`,
        ref: { refType: "room", refId: r.id },
      }));
  },
};

// ---------------- Scenes ----------------
export const scenesProvider: SearchProviderDescriptor = {
  id: "search.provider.scenes",
  label: "Szenen",
  category: "scene",
  icon: "sparkles",
  priority: 80,
  permissionResource: "scene",
  search: async (ctx) => {
    const q = ctx.query;
    const scenes = useScenesStore.getState().scenes;
    const { sceneExecutor } = await import("@/services/scenes");
    return scenes
      .filter((s) => matches(`${s.name} ${s.category}`, q))
      .map<SearchResult>((s) => ({
        id: `scene:${s.id}`,
        providerId: scenesProvider.id,
        category: "scene",
        type: "entity",
        title: s.name,
        subtitle: s.category,
        icon: s.icon ?? "sparkles",
        color: s.color,
        relevance: relevance(s.name, q),
        priority: s.favorite ? 6 : 4,
        permission: { resource: "scene", action: "read", refId: s.id },
        navigateTo: `/scenes/${s.id}`,
        ref: { refType: "scene", refId: s.id },
        actions: [
          {
            id: "activate",
            label: "Szene starten",
            icon: "play",
            primary: true,
            run: () => {
              void sceneExecutor.run(s.id);
            },
          },
          {
            id: "open",
            label: "Öffnen",
            icon: "external-link",
            run: (c) => c.navigate?.(`/scenes/${s.id}`),
          },
        ],
      }));
  },
};

// ---------------- Groups ----------------
export const groupsProvider: SearchProviderDescriptor = {
  id: "search.provider.groups",
  label: "Gerätegruppen",
  category: "group",
  icon: "layers",
  priority: 75,
  permissionResource: "group",
  search: (ctx) => {
    const q = ctx.query;
    const groups = useGroupsStore.getState().groups;
    return groups
      .filter((g) => matches(`${g.name} ${g.kind}`, q))
      .map<SearchResult>((g) => ({
        id: `group:${g.id}`,
        providerId: groupsProvider.id,
        category: "group",
        type: "entity",
        title: g.name,
        subtitle: g.kind,
        icon: g.icon ?? "layers",
        color: g.color,
        relevance: relevance(g.name, q),
        priority: 3,
        permission: { resource: "group", action: "read", refId: g.id },
        navigateTo: `/groups/${g.id}`,
        ref: { refType: "group", refId: g.id },
      }));
  },
};

// ---------------- Automations ----------------
export const automationsProvider: SearchProviderDescriptor = {
  id: "search.provider.automations",
  label: "Automationen",
  category: "automation",
  icon: "workflow",
  priority: 70,
  permissionResource: "automation",
  search: async (ctx) => {
    const q = ctx.query;
    const automations = useAutomationsStore.getState().automations;
    const { automationExecutor } = await import("@/services/automations");
    return automations
      .filter((a) => matches(`${a.name} ${a.category ?? ""}`, q))
      .map<SearchResult>((a) => ({
        id: `automation:${a.id}`,
        providerId: automationsProvider.id,
        category: "automation",
        type: "entity",
        title: a.name,
        subtitle: a.category,
        icon: a.icon ?? "workflow",
        relevance: relevance(a.name, q),
        priority: 3,
        permission: { resource: "automation", action: "read", refId: a.id },
        navigateTo: `/automations/${a.id}`,
        ref: { refType: "automation", refId: a.id },
        actions: [
          {
            id: "trigger",
            label: "Auslösen",
            icon: "play",
            primary: true,
            run: () => {
              void automationExecutor.run(a.id, { triggerId: "manual" });
            },
          },
          {
            id: "open",
            label: "Öffnen",
            run: (c) => c.navigate?.(`/automations/${a.id}`),
          },
        ],
      }));
  },
};

// ---------------- Users ----------------
export const usersProvider: SearchProviderDescriptor = {
  id: "search.provider.users",
  label: "Benutzer",
  category: "user",
  icon: "user",
  priority: 60,
  permissionResource: "user",
  search: (ctx) => {
    const q = ctx.query;
    const users = useUsersStore.getState().users;
    return users
      .filter((u) =>
        matches(`${u.name} ${u.firstName ?? ""} ${u.lastName ?? ""}`, q),
      )
      .map<SearchResult>((u) => ({
        id: `user:${u.id}`,
        providerId: usersProvider.id,
        category: "user",
        type: "entity",
        title: u.name,
        subtitle: u.isAdmin ? "Administrator" : u.isGuest ? "Gast" : "Benutzer",
        icon: u.icon ?? "user",
        color: u.color,
        relevance: relevance(u.name, q),
        permission: { resource: "user", action: "read" },
        navigateTo: `/users/${u.id}`,
        ref: { refType: "user", refId: u.id },
      }));
  },
};

// ---------------- Dashboards ----------------
export const dashboardsProvider: SearchProviderDescriptor = {
  id: "search.provider.dashboards",
  label: "Dashboards",
  category: "dashboard",
  icon: "layout-dashboard",
  priority: 65,
  permissionResource: "dashboard",
  search: async (ctx) => {
    const q = ctx.query;
    const dashboards = useDashboardsStore.getState().listOrdered();
    const { dashboardManager } = await import(
      "@/services/dashboards/DashboardManager"
    );
    return dashboards
      .filter((d) => matches(d.name ?? "", q))
      .map<SearchResult>((d) => ({
        id: `dashboard:${d.id}`,
        providerId: dashboardsProvider.id,
        category: "dashboard",
        type: "entity",
        title: d.name ?? "Dashboard",
        subtitle: d.description,
        icon: d.icon ?? "layout-dashboard",
        relevance: relevance(d.name ?? "", q),
        permission: { resource: "dashboard", action: "read" },
        navigateTo: `/dashboards/${d.id}`,
        ref: { refType: "dashboard", refId: d.id },
        actions: [
          {
            id: "activate",
            label: "Dashboard wechseln",
            icon: "arrow-right",
            primary: true,
            run: (c) => {
              dashboardManager.activate(d.id);
              c.navigate?.(`/dashboards/${d.id}`);
            },
          },
        ],
      }));
  },
};

// ---------------- Widgets ----------------
export const widgetsProvider: SearchProviderDescriptor = {
  id: "search.provider.widgets",
  label: "Widgets",
  category: "widget",
  icon: "layout-panel-top",
  priority: 40,
  permissionResource: "widget",
  search: (ctx) => {
    const q = ctx.query;
    const descriptors = widgetRegistry.list();
    return descriptors
      .filter((d) => matches(`${d.name} ${d.description ?? ""}`, q))
      .map<SearchResult>((d) => ({
        id: `widget:${d.id}`,
        providerId: widgetsProvider.id,
        category: "widget",
        type: "entity",
        title: d.name,
        subtitle: d.description,
        icon: d.icon ?? "layout-panel-top",
        relevance: relevance(d.name, q),
        permission: { resource: "widget", action: "read" },
        ref: { refType: "widget", refId: d.id },
      }));
  },
};

// ---------------- Timeline ----------------
export const timelineProvider: SearchProviderDescriptor = {
  id: "search.provider.timeline",
  label: "Timeline",
  category: "timeline",
  icon: "history",
  priority: 30,
  permissionResource: "timeline",
  search: (ctx) => {
    const q = ctx.query;
    const entries = useTimelineStore.getState().entries.slice(0, 500);
    return entries
      .filter((e) =>
        matches(`${e.title ?? ""} ${e.detail ?? ""} ${e.kind}`, q),
      )
      .slice(0, 20)
      .map<SearchResult>((e) => ({
        id: `timeline:${e.id}`,
        providerId: timelineProvider.id,
        category: "timeline",
        type: "history",
        title: e.title ?? e.kind,
        subtitle: e.detail,
        icon: "history",
        relevance: relevance(e.title ?? e.kind, q),
        permission: { resource: "timeline", action: "read" },
        navigateTo: "/timeline",
      }));
  },
};

// ---------------- Notifications ----------------
export const notificationsProvider: SearchProviderDescriptor = {
  id: "search.provider.notifications",
  label: "Benachrichtigungen",
  category: "notification",
  icon: "bell",
  priority: 50,
  permissionResource: "notification",
  search: (ctx) => {
    const q = ctx.query;
    const notifs = useNotificationsStore.getState().notifications;
    return notifs
      .filter((n) => matches(`${n.title} ${n.message ?? ""}`, q))
      .slice(0, 20)
      .map<SearchResult>((n) => ({
        id: `notification:${n.id}`,
        providerId: notificationsProvider.id,
        category: "notification",
        type: "entity",
        title: n.title,
        subtitle: n.message,
        icon: "bell",
        relevance: relevance(n.title, q),
        permission: { resource: "notification", action: "read" },
        navigateTo: `/inbox/${n.id}`,
        ref: { refType: "notification", refId: n.id },
      }));
  },
};

// ---------------- Navigation (routes) ----------------
interface NavEntry {
  path: string;
  label: string;
  hint?: string;
  icon?: string;
  keywords?: string[];
}

const NAV_ENTRIES: NavEntry[] = [
  { path: "/", label: "Start", icon: "home", keywords: ["home", "dashboard"] },
  { path: "/rooms", label: "Räume", icon: "layout-grid" },
  { path: "/devices", label: "Geräte", icon: "cpu" },
  { path: "/scenes", label: "Szenen", icon: "sparkles" },
  { path: "/groups", label: "Gruppen", icon: "layers" },
  { path: "/automations", label: "Automationen", icon: "workflow" },
  { path: "/dashboards", label: "Dashboards", icon: "layout-dashboard" },
  { path: "/inbox", label: "Ereignisse", icon: "bell" },
  { path: "/timeline", label: "Timeline", icon: "history" },
  { path: "/history", label: "Historie", icon: "history" },
  { path: "/analytics", label: "Analytics", icon: "line-chart" },
  { path: "/statistics", label: "Statistik", icon: "bar-chart-3" },
  { path: "/users", label: "Benutzer", icon: "users" },
  { path: "/profiles", label: "Profile", icon: "user-cog" },
  { path: "/roles", label: "Rollen", icon: "shield-check" },
  { path: "/permissions", label: "Berechtigungen", icon: "shield-check" },
  { path: "/settings", label: "Einstellungen", icon: "settings" },
  { path: "/search", label: "Suche", icon: "search" },
  { path: "/search/history", label: "Suchverlauf", icon: "history" },
  { path: "/search/favorites", label: "Such-Favoriten", icon: "star" },
];

export const navigationProvider: SearchProviderDescriptor = {
  id: "search.provider.navigation",
  label: "Navigation",
  category: "navigation",
  icon: "compass",
  priority: 55,
  search: (ctx) => {
    const q = ctx.query;
    return NAV_ENTRIES.filter((e) =>
      matches(`${e.label} ${(e.keywords ?? []).join(" ")} ${e.path}`, q),
    ).map<SearchResult>((e) => ({
      id: `nav:${e.path}`,
      providerId: navigationProvider.id,
      category: "navigation",
      type: "navigation",
      title: e.label,
      subtitle: e.path,
      icon: e.icon,
      relevance: relevance(e.label, q),
      priority: 4,
      navigateTo: e.path,
    }));
  },
};

// ---------------- Settings ----------------
const SETTINGS_ENTRIES: NavEntry[] = [
  { path: "/settings/server", label: "Server & Verbindung", icon: "server" },
  { path: "/settings/appearance", label: "Darstellung", icon: "palette" },
  { path: "/settings/language", label: "Sprache", icon: "languages" },
  { path: "/settings/notifications", label: "Benachrichtigungen", icon: "bell" },
  { path: "/settings/backup", label: "Backup & Wiederherstellung", icon: "save" },
  { path: "/settings/users", label: "Benutzer", icon: "users" },
  { path: "/settings/developer", label: "Entwickler", icon: "terminal" },
];

export const settingsProvider: SearchProviderDescriptor = {
  id: "search.provider.settings",
  label: "Einstellungen",
  category: "settings",
  icon: "settings",
  priority: 35,
  permissionResource: "settings",
  search: (ctx) => {
    const q = ctx.query;
    return SETTINGS_ENTRIES.filter((e) => matches(e.label, q)).map<SearchResult>(
      (e) => ({
        id: `settings:${e.path}`,
        providerId: settingsProvider.id,
        category: "settings",
        type: "navigation",
        title: e.label,
        subtitle: e.path,
        icon: e.icon,
        relevance: relevance(e.label, q),
        permission: { resource: "settings", action: "read" },
        navigateTo: e.path,
      }),
    );
  },
};

// ---------------- History / Analytics / Logs ----------------
export const historyProvider: SearchProviderDescriptor = {
  id: "search.provider.history",
  label: "Historie",
  category: "history",
  icon: "history",
  priority: 20,
  permissionResource: "history",
  search: (ctx) => {
    const q = ctx.query;
    // History content lives inside Timeline. This provider surfaces the page
    // + generic filters when the user searches for terms like "verlauf".
    if (!q) return [];
    if (!matches("verlauf history historie ausführungen", q)) return [];
    return [
      {
        id: "history:page",
        providerId: historyProvider.id,
        category: "history",
        type: "navigation",
        title: "Historie öffnen",
        subtitle: "Abgeschlossene Ausführungen",
        icon: "history",
        relevance: 0.8,
        permission: { resource: "history", action: "read" },
        navigateTo: "/history",
      },
    ];
  },
};

export const analyticsProvider: SearchProviderDescriptor = {
  id: "search.provider.analytics",
  label: "Analytics",
  category: "analytics",
  icon: "line-chart",
  priority: 20,
  permissionResource: "analytics",
  search: (ctx) => {
    const q = ctx.query;
    if (!q) return [];
    if (!matches("analytics analyse statistik kennzahlen diagramm", q)) return [];
    return [
      {
        id: "analytics:page",
        providerId: analyticsProvider.id,
        category: "analytics",
        type: "navigation",
        title: "Analytics öffnen",
        subtitle: "Kennzahlen und Diagramme",
        icon: "line-chart",
        relevance: 0.8,
        permission: { resource: "analytics", action: "read" },
        navigateTo: "/analytics",
      },
    ];
  },
};

export const logsProvider: SearchProviderDescriptor = {
  id: "search.provider.logs",
  label: "Logs",
  category: "logs",
  icon: "terminal",
  priority: 15,
  permissionResource: "settings",
  search: (ctx) => {
    const q = ctx.query;
    if (!q) return [];
    if (!matches("log logs protokoll entwickler", q)) return [];
    return [
      {
        id: "logs:page",
        providerId: logsProvider.id,
        category: "logs",
        type: "navigation",
        title: "Entwickler-Logs",
        icon: "terminal",
        relevance: 0.7,
        permission: { resource: "settings", action: "read" },
        navigateTo: "/settings/developer",
      },
    ];
  },
};

export const BUILTIN_SEARCH_PROVIDERS: SearchProviderDescriptor[] = [
  devicesProvider,
  roomsProvider,
  scenesProvider,
  groupsProvider,
  automationsProvider,
  usersProvider,
  dashboardsProvider,
  widgetsProvider,
  timelineProvider,
  notificationsProvider,
  navigationProvider,
  settingsProvider,
  historyProvider,
  analyticsProvider,
  logsProvider,
];
