import { create } from "zustand";
import type { AppNotification } from "@/models/notification";
import type { EventCategory } from "@/models/eventCategory";
import type { Severity } from "@/models/severity";
import type { ID } from "@/models/common";

interface NotificationsState {
  items: AppNotification[];
  byId: Record<string, AppNotification>;
  maxSize: number;

  setMaxSize: (n: number) => void;
  push: (n: AppNotification) => void;
  update: (id: string, patch: Partial<AppNotification>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clear: () => void;

  /** Legacy convenience — unverändert für bestehende Aufrufer. */
  unreadCount: () => number;
}

const DEFAULT_MAX = 500;

function applyPatch<T extends object>(a: T, b: Partial<T>): T {
  return { ...a, ...b };
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  byId: {},
  maxSize: DEFAULT_MAX,

  setMaxSize: (n) => set({ maxSize: Math.max(50, n | 0) }),

  push: (n) =>
    set((s) => {
      const existing = s.byId[n.id];
      if (existing) {
        const merged = applyPatch(existing, n);
        return {
          byId: { ...s.byId, [n.id]: merged },
          items: s.items.map((i) => (i.id === n.id ? merged : i)),
        };
      }
      const nextItems = [n, ...s.items].slice(0, s.maxSize);
      const nextById = { ...s.byId, [n.id]: n };
      // Falls durch das Slicing ein Eintrag entfernt wurde, aus der Map entfernen.
      if (s.items.length >= s.maxSize) {
        const dropped = s.items[s.items.length - 1];
        if (dropped && dropped.id !== n.id) delete nextById[dropped.id];
      }
      return { items: nextItems, byId: nextById };
    }),

  update: (id, patch) =>
    set((s) => {
      const existing = s.byId[id];
      if (!existing) return s;
      const merged = applyPatch(existing, patch);
      return {
        byId: { ...s.byId, [id]: merged },
        items: s.items.map((i) => (i.id === id ? merged : i)),
      };
    }),

  markRead: (id) => get().update(id, { read: true }),
  markAllRead: () =>
    set((s) => {
      const nextById: Record<string, AppNotification> = {};
      const nextItems = s.items.map((i) => {
        const upd = { ...i, read: true };
        nextById[i.id] = upd;
        return upd;
      });
      return { items: nextItems, byId: nextById };
    }),

  remove: (id) =>
    set((s) => {
      if (!s.byId[id]) return s;
      const { [id]: _, ...rest } = s.byId;
      return { items: s.items.filter((i) => i.id !== id), byId: rest };
    }),

  clear: () => set({ items: [], byId: {} }),

  unreadCount: () => get().items.reduce((n, i) => n + (i.read ? 0 : 1), 0),
}));

/* ---------------- Selectors (memoization-freundlich) ---------------- */

export const selectUnread = (s: NotificationsState) =>
  s.items.filter((i) => !i.read && !i.archived);

export const selectUnreadCount = (s: NotificationsState) =>
  s.items.reduce((n, i) => n + (i.read || i.archived ? 0 : 1), 0);

export const selectPinned = (s: NotificationsState) =>
  s.items.filter((i) => i.pinned && !i.archived);

export const selectFavorites = (s: NotificationsState) =>
  s.items.filter((i) => i.favorite && !i.archived);

export const selectArchived = (s: NotificationsState) =>
  s.items.filter((i) => i.archived);

export const selectActive = (s: NotificationsState) =>
  s.items.filter((i) => !i.archived);

export function selectBySeverity(sev: Severity) {
  return (s: NotificationsState) =>
    s.items.filter((i) => !i.archived && i.severity === sev);
}

export function selectCritical(s: NotificationsState) {
  return s.items.filter(
    (i) => !i.archived && (i.severity === "critical" || i.severity === "error"),
  );
}

export function selectWarnings(s: NotificationsState) {
  return s.items.filter((i) => !i.archived && i.severity === "warning");
}

export function selectByCategory(cat: EventCategory) {
  return (s: NotificationsState) =>
    s.items.filter((i) => !i.archived && i.category === cat);
}

export function selectByRef(refType: string, refId: ID) {
  return (s: NotificationsState) =>
    s.items.filter(
      (i) => !i.archived && i.refType === refType && i.refId === refId,
    );
}

export const selectByRoom = (roomId: ID) => selectByRef("room", roomId);
export const selectByDevice = (deviceId: ID) => selectByRef("device", deviceId);
export const selectByAutomation = (id: ID) => selectByRef("automation", id);
export const selectByScene = (id: ID) => selectByRef("scene", id);
export const selectByGroup = (id: ID) => selectByRef("group", id);

/** Vorbereitung Teil 12 — benutzerabhängige Filterung. */
export function selectByUser(userId: ID | undefined) {
  return (s: NotificationsState) =>
    s.items.filter((i) => !i.archived && (!userId || i.userId === userId));
}
