import { Search } from "lucide-react";
import { useSearchStore } from "@/store/slices/searchStore";

/**
 * Floating search button for mobile / any layout that lacks a top bar
 * shortcut. Opens the CommandPalette; keyboard users use Cmd/Ctrl+K.
 */
export function FloatingSearchButton() {
  const open = useSearchStore((s) => s.openPalette);
  return (
    <button
      type="button"
      onClick={() => open()}
      className="glass-card hairline fixed bottom-24 right-4 z-40 grid h-12 w-12 place-items-center rounded-full text-accent shadow-xl md:hidden"
      aria-label="Suche öffnen"
    >
      <Search className="h-5 w-5" aria-hidden />
    </button>
  );
}
