import { create } from "zustand";
import type { AppNotification } from "@/models/notification";

interface NotificationsState {
  items: AppNotification[];
  unreadCount: () => number;
  push: (n: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX = 200;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  unreadCount: () => get().items.reduce((n, i) => n + (i.read ? 0 : 1), 0),
  push: (n) =>
    set((s) => ({ items: [n, ...s.items].slice(0, MAX) })),
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
    })),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })) })),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] }),
}));
