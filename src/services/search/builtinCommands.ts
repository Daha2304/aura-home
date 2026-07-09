import { commandRegistry } from "./CommandRegistry";
import { useSearchStore } from "@/store/slices/searchStore";

/**
 * Built-in commands. Palette-only actions that do not need their own
 * SearchProvider. Domain-specific commands live in their own services.
 */
export function registerBuiltinCommands(): void {
  commandRegistry.register({
    id: "cmd.palette.close",
    label: "Palette schließen",
    hint: "Esc",
    category: "command",
    icon: "x",
    shortcut: "Esc",
    priority: 1,
    run: () => useSearchStore.getState().closePalette(),
  });
  commandRegistry.register({
    id: "cmd.clear-history",
    label: "Suchverlauf leeren",
    category: "command",
    icon: "trash",
    keywords: ["history", "verlauf", "löschen"],
    priority: 2,
    run: async () => {
      const { useSearchHistoryStore } = await import(
        "@/store/slices/searchHistoryStore"
      );
      useSearchHistoryStore.getState().clearAll();
    },
  });
  commandRegistry.register({
    id: "cmd.search.open",
    label: "Suche öffnen",
    hint: "Ctrl/Cmd + K",
    category: "command",
    icon: "search",
    shortcut: "⌘K",
    priority: 10,
    run: () => useSearchStore.getState().openPalette(),
  });
}
