import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "system" | "light" | "dark";
export type Language = "de" | "en";

interface UiState {
  theme: ThemeMode;
  language: Language;
  reduceMotion: boolean;
  editingDashboard: boolean;
  setTheme: (t: ThemeMode) => void;
  setLanguage: (l: Language) => void;
  setReduceMotion: (v: boolean) => void;
  setEditingDashboard: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      language: "de",
      reduceMotion: false,
      editingDashboard: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setEditingDashboard: (editingDashboard) => set({ editingDashboard }),
    }),
    {
      name: "smarthome.ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        language: s.language,
        reduceMotion: s.reduceMotion,
      }),
    },
  ),
);
