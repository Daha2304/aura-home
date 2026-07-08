import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/models/user";

interface UsersState {
  users: User[];
  currentUserId?: string;
  setUsers: (u: User[]) => void;
  addUser: (u: User) => void;
  removeUser: (id: string) => void;
  setCurrentUser: (id: string | undefined) => void;
  currentUser: () => User | undefined;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: undefined,
      setUsers: (users) => set({ users }),
      addUser: (u) => set({ users: [...get().users, u] }),
      removeUser: (id) =>
        set({ users: get().users.filter((u) => u.id !== id) }),
      setCurrentUser: (id) => set({ currentUserId: id }),
      currentUser: () => get().users.find((u) => u.id === get().currentUserId),
    }),
    {
      name: "smarthome.users",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
