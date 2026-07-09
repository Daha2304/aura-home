import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import { Search, Star, History as HistoryIcon, Zap, Sparkles } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { useSearchHistoryStore } from "@/store/slices/searchHistoryStore";
import { useSearchFavoritesStore } from "@/store/slices/searchFavoritesStore";
import { commandRegistry } from "@/services/search/CommandRegistry";
import { useSearchStore } from "@/store/slices/searchStore";
import type { SearchContext } from "@/models/search";

const ALL_LAYOUTS = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
] as const;

function SearchBarWidget() {
  return (
    <div className="p-3">
      <SearchBar placeholder="Suche öffnen…" />
    </div>
  );
}

function RecentSearchesWidget() {
  const entries = useSearchHistoryStore((s) => s.entries.slice(0, 6));
  const open = useSearchStore((s) => s.openPalette);
  return (
    <div className="h-full overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <HistoryIcon className="h-4 w-4" /> Zuletzt gesucht
      </div>
      {entries.length === 0 ? (
        <div className="grid h-[calc(100%-1.5rem)] place-items-center text-[11px] text-muted-foreground">
          Kein Verlauf
        </div>
      ) : (
        <ul className="space-y-1 text-xs">
          {entries.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => open(e.query)}
                className="w-full truncate rounded-lg bg-white/5 px-2 py-1 text-left hover:bg-white/10"
              >
                {e.query}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FavoritesWidget() {
  const favorites = useSearchFavoritesStore((s) => s.favorites.slice(0, 6));
  return (
    <div className="h-full overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Star className="h-4 w-4" /> Favoriten
      </div>
      {favorites.length === 0 ? (
        <div className="grid h-[calc(100%-1.5rem)] place-items-center text-[11px] text-muted-foreground">
          Keine Favoriten
        </div>
      ) : (
        <ul className="space-y-1 text-xs">
          {favorites.map((f) => (
            <li key={f.id} className="truncate rounded-lg bg-white/5 px-2 py-1">
              {f.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickActionsWidget() {
  const commands = commandRegistry.list().slice(0, 6);
  const ctx: SearchContext = {
    query: "",
    timestamp: Date.now(),
  };
  return (
    <div className="h-full overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-4 w-4" /> Schnellaktionen
      </div>
      <ul className="space-y-1 text-xs">
        {commands.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => void c.run(ctx)}
              className="w-full truncate rounded-lg bg-white/5 px-2 py-1 text-left hover:bg-white/10"
            >
              {c.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionsWidget() {
  const open = useSearchStore((s) => s.openPalette);
  return (
    <div className="grid h-full place-items-center p-3">
      <button
        type="button"
        onClick={() => open()}
        className="glass-card hairline flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        Vorschläge & Suche öffnen
      </button>
    </div>
  );
}

const descriptors = [
  defineWidget({
    id: "search.bar",
    name: "Suchleiste",
    category: "system",
    description: "Öffnet die globale Command Palette.",
    icon: "search",
    defaultSize: { w: 4, h: 1 }, minSize: { w: 3, h: 1 }, maxSize: { w: 8, h: 2 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <SearchBarWidget />,
  }),
  defineWidget({
    id: "search.recent",
    name: "Zuletzt gesucht",
    category: "system",
    description: "Letzte Suchanfragen.",
    icon: "history",
    defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <RecentSearchesWidget />,
  }),
  defineWidget({
    id: "search.favorites",
    name: "Such-Favoriten",
    category: "system",
    description: "Gespeicherte Suchergebnisse.",
    icon: "star",
    defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <FavoritesWidget />,
  }),
  defineWidget({
    id: "search.quickActions",
    name: "Schnellaktionen",
    category: "system",
    description: "Registrierte Befehle direkt ausführen.",
    icon: "zap",
    defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <QuickActionsWidget />,
  }),
  defineWidget({
    id: "search.suggestions",
    name: "Suche & Vorschläge",
    category: "system",
    description: "Öffnet die Command Palette mit Vorschlägen.",
    icon: "sparkles",
    defaultSize: { w: 3, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 6, h: 3 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <SuggestionsWidget />,
  }),
];

let registered = false;
export function registerSearchWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const SEARCH_WIDGET_IDS = descriptors.map((d) => d.id);
