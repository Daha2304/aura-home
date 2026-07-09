import { Search } from "lucide-react";
import { useSearchStore } from "@/store/slices/searchStore";

/**
 * Inline search bar. Focus/click opens the CommandPalette with any typed
 * text pre-seeded. Kept intentionally simple so widget & route hosts can
 * reuse it.
 */
export function SearchBar({ placeholder = "Suchen…" }: { placeholder?: string }) {
  const open = useSearchStore((s) => s.openPalette);
  return (
    <button
      type="button"
      onClick={() => open()}
      className="glass-card hairline flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm text-muted-foreground transition hover:text-foreground"
      aria-label="Suche öffnen"
    >
      <Search className="h-4 w-4" aria-hidden />
      <span className="flex-1 truncate">{placeholder}</span>
      <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
