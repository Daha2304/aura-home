import { createJSONStorage, type StateStorage } from "zustand/middleware";

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const persistentStorage = () =>
  createJSONStorage(() =>
    typeof window === "undefined" ? memoryStorage : window.localStorage,
  );
