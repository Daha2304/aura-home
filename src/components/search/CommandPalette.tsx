import { useEffect, useMemo, useRef, useState } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, Star, ArrowRight, Loader2 } from "lucide-react";
import { useSearchStore } from "@/store/slices/searchStore";
import { searchManager } from "@/services/search/SearchManager";
import type { SearchResult, SearchContext } from "@/models/search";
import { useSearchFavoritesStore } from "@/store/slices/searchFavoritesStore";
import { useUsersStore } from "@/store/slices/usersStore";
import { cn } from "@/lib/utils";

/**
 * Command Palette overlay. Global Cmd/Ctrl+K entry. Registry-based results
 * from SearchManager — no provider-specific branches here.
 */
export function CommandPalette() {
  const open = useSearchStore((s) => s.paletteOpen);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const close = useSearchStore((s) => s.closePalette);
  const setResults = useSearchStore((s) => s.setResults);
  const [results, setLocalResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = useUsersStore((s) =>
    s.currentUserId ? s.byId[s.currentUserId] : undefined,
  );
  const isFavorite = useSearchFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useSearchFavoritesStore((s) => s.toggle);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounced search fan-out.
  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const out = await searchManager.search(query, {
        navigate: (to) => navigate({ to }),
      });
      setLocalResults(out);
      setResults(out);
      setLoading(false);
      if (query.trim()) searchManager.recordQuery(query, out.length);
    }, 120);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, navigate, setResults]);

  // Reset selection on open.
  useEffect(() => {
    if (open) setLocalResults([]);
  }, [open]);

  const grouped = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    for (const r of results) {
      const key = r.category;
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }
    return [...groups.entries()];
  }, [results]);

  const runResult = async (r: SearchResult) => {
    searchManager.recordOpen(r);
    const primary = r.actions?.find((a) => a.primary) ?? r.actions?.[0];
    const ctx: SearchContext = {
      query,
      userId: currentUser?.id,
      timestamp: Date.now(),
      navigate: (to) => navigate({ to }),
    };
    if (primary) {
      await primary.run(ctx);
    } else if (r.navigateTo) {
      navigate({ to: r.navigateTo });
    }
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-start bg-black/50 pt-[10vh] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
          role="presentation"
        >
          <motion.div
            className="glass-card hairline w-[92vw] max-w-2xl overflow-hidden rounded-3xl border border-white/10 p-0 shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Command Palette"
          >
            <Command
              label="Suche & Befehle"
              shouldFilter={false}
              className="flex flex-col"
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <SearchIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Suche Geräte, Räume, Szenen, Befehle…"
                  className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
                  aria-label="Suchbegriff"
                />
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                )}
                <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
                  Esc
                </kbd>
              </div>
              <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                {results.length === 0 && !loading && query.trim() && (
                  <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Keine Treffer für „{query}"
                  </Command.Empty>
                )}
                {results.length === 0 && !query.trim() && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Tippen, um zu suchen. Enter startet die primäre Aktion.
                  </div>
                )}
                {grouped.map(([category, items]) => (
                  <Command.Group
                    key={category}
                    heading={
                      <span className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {category}
                      </span>
                    }
                  >
                    {items.map((r) => {
                      const fav = isFavorite(r.id, currentUser?.id);
                      return (
                        <Command.Item
                          key={r.id}
                          value={r.id}
                          onSelect={() => runResult(r)}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm",
                            "data-[selected=true]:bg-white/10",
                          )}
                        >
                          <div
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5"
                            style={r.color ? { color: r.color } : undefined}
                            aria-hidden
                          >
                            <span className="text-xs">{r.icon?.[0]?.toUpperCase() ?? "•"}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 truncate">
                              <span className="truncate font-medium">{r.title}</span>
                              {r.type === "command" && (
                                <span className="rounded bg-white/10 px-1.5 py-px text-[10px] uppercase text-muted-foreground">
                                  Cmd
                                </span>
                              )}
                            </div>
                            {r.subtitle && (
                              <div className="truncate text-xs text-muted-foreground">
                                {r.subtitle}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="rounded p-1 text-muted-foreground hover:text-accent"
                            aria-label={fav ? "Favorit entfernen" : "Als Favorit markieren"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite({
                                id: `${currentUser?.id ?? "anon"}:${r.id}`,
                                userId: currentUser?.id,
                                resultId: r.id,
                                providerId: r.providerId,
                                category: r.category,
                                title: r.title,
                                addedAt: Date.now(),
                                refType: r.ref?.refType,
                                refId: r.ref?.refId,
                              });
                            }}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                fav && "fill-amber-400 text-amber-400",
                              )}
                              aria-hidden
                            />
                          </button>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
