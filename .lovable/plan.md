# Teil 13 — Globale Suche & Command Palette

Vollständig generische Suchplattform mit Registry-basierten Providern, moderner Command Palette und Integration in alle bestehenden Systeme. Keine parallelen Datenmodelle, keine Hardcodierung.

## 1. Modelle (`src/models/`)

- `search.ts` — `SearchResult`, `SearchQuery`, `SearchAction`, `SearchCategory`, `SearchResultType`, `SearchContext` (userId, permissions, timestamp), `SearchScore`.
- `searchProvider.ts` — `SearchProviderDescriptor` (id, label, icon, category, priority, permissionResource?, `search(query, ctx) => SearchResult[]`, optional `index()` für incremental index, optional `suggest()`).
- `searchHistory.ts` — `SearchHistoryEntry`, `SearchFavorite`, `RecentOpen`.
- `searchPreferences.ts` — User-scope Preferences (pinned providers, disabled categories, sortOrder).
- `commandPalette.ts` — `CommandDescriptor` (extends SearchResult mit `run(ctx)`), `CommandGroup`.

## 2. Services (`src/services/search/`)

- `SearchProviderRegistry.ts` — register/unregister/list Provider; keine Switch/If-Kaskaden.
- `SearchIndex.ts` — generischer, lazy, inkrementeller Index (Map-basiert, Tokenizer + n-gram); O(1)-Lookup per id, per-token invertierter Index. Providers dürfen Index selbst nutzen oder eigene `search()` liefern.
- `SearchManager.ts` — orchestriert Query → fan-out an Provider (parallel, debounced) → PermissionEvaluator-Filter → Ranking → Cache.
- `SearchRanking.ts` — Score aus Relevanz (Textmatch), Favorit, Recency, Frequency, Priorität, Provider-Weight.
- `SearchCache.ts` — LRU per normalisierte Query, TTL, Invalidierung bei Store-Änderungen.
- `SearchHistoryManager.ts` — Recent Searches, Recent Opens, Favorites (via Store).
- `SearchSuggestions.ts` — Autocomplete aus History + Index + Provider-`suggest()`.
- `CommandRegistry.ts` — registriert globale Commands (Navigation, Quick Actions); Command ist ein SearchProvider-Adapter.
- `builtinProviders/` — dünne Adapter, jeder Provider liest ausschließlich aus vorhandenen Stores/Registries:
  - `devicesProvider.ts` (deviceRegistry + Capability → Steuer-Actions)
  - `roomsProvider.ts`
  - `scenesProvider.ts` (Action: aktivieren via SceneManager)
  - `groupsProvider.ts`
  - `automationsProvider.ts` (Action: triggern via AutomationEngine)
  - `usersProvider.ts`
  - `dashboardsProvider.ts` / `widgetsProvider.ts`
  - `timelineProvider.ts` (via TimelineSourceRegistry read-only)
  - `notificationsProvider.ts`
  - `analyticsProvider.ts`, `logsProvider.ts`, `settingsProvider.ts`
  - `navigationProvider.ts` — Route-basierte Commands.
- `serialization.ts` — Import/Export von History, Favorites, Preferences (JSON, schemaVersion).
- `index.ts` — Barrel + `startSearchPlatform()` / `stopSearchPlatform()`.

Alle Provider werden in `bootstrap.ts` via `SearchProviderRegistry.register(...)` gebunden.

## 3. Stores (`src/store/slices/`)

- `searchStore.ts` — aktuelle Query, results (memoized), open state der Palette, activeCategory-Filter.
- `searchHistoryStore.ts` — persistent (via `_persistStorage`), pro userId (Vorbereitung).
- `searchFavoritesStore.ts` — persistent, pro userId.
- `searchPreferencesStore.ts` — persistent, pro userId.

Alle mit Selektoren (`selectRecent`, `selectFavoritesOf(userId)`, `selectFrequency`).

## 4. UI / Komponenten (`src/components/search/`)

- `CommandPalette.tsx` — globales Overlay (Radix Dialog + Framer Motion + Glass Design), Cmd/Ctrl+K, virtualisierte Result-Liste, Kategorie-Gruppen, Keyboard-Navigation (↑↓, Enter, Tab für Actions), Fokusmanagement.
- `CommandPaletteHost.tsx` — mounted in `_app.tsx`, registriert globale Shortcut-Listener.
- `SearchResultItem.tsx` — memoized, Icon+Farbe+Titel+Untertitel+Actions.
- `SearchActionsMenu.tsx` — Sub-Menü für per-Result Actions.
- `SearchBar.tsx` — inline Suchfeld (für Widget & Route).
- `SearchHistoryList.tsx`, `SearchSuggestionsList.tsx`, `SearchFavoritesList.tsx`.
- `FloatingSearchButton.tsx` — Mobile FAB.

## 5. Routen (`src/routes/`)

- `_app.search.tsx` (Layout mit `<Outlet />`).
- `_app.search.index.tsx` → `/search` (Landing mit Suchfeld + Empfehlungen).
- `_app.search.results.tsx` → `/search/results` (validateSearch: `q`, `category`).
- `_app.search.history.tsx` → `/search/history`.
- `_app.search.favorites.tsx` → `/search/favorites`.

Command Palette bleibt als globales Overlay (kein Route-Wechsel).

## 6. Widgets (`src/services/widgets/builtin/search.tsx`)

Registrierung via `WidgetRegistry.register(...)`:
- `search.bar`
- `search.recent`
- `search.quickActions`
- `search.favorites`
- `search.suggestions`

## 7. Integrationen

- **Permissions**: `SearchManager` ruft `PermissionEvaluator.can(user, resource, 'read')` auf Basis von `provider.permissionResource`. Ergebnisse ohne Zugriff werden gefiltert.
- **User Manager**: `SearchContext.userId` aus aktivem User; History/Favorites/Preferences pro User.
- **Timeline / Event Center / Notifications**: als reguläre Provider (read-only auf bestehende Stores/Registries).
- **Universal Control Engine**: `SearchAction.run` ruft UCE für Gerätesteuerung; keine WebSocket-Direktaufrufe.
- **Dashboard**: Command "Dashboard wechseln" via DashboardRuntime; Widget-Suche via WidgetRegistry.

## 8. Bootstrap

`src/services/bootstrap.ts`: `startSearchPlatform()` — registriert built-in Provider + Navigation-Commands + Shortcut-Listener. `_app.tsx` mountet `<CommandPaletteHost />`.

## 9. Performance & A11y

- Debounced Query (150ms), memoized Selektoren, `React.memo` für Items, `react-virtual` für lange Listen, Code-Splitting per lazy-imported Route.
- ARIA: `role="combobox"`/`role="listbox"`, `aria-activedescendant`, focus-trap in Dialog, große Touch-Targets (min. 44px).

## 10. Offline-Vorbereitung (nur Vorbereitung)

- Alle Provider arbeiten synchron auf lokalen Stores → funktionieren offline bereits.
- Index/History/Favorites/Preferences persistiert via `_persistStorage`.
- Keine Sync-Logik in diesem Teil.

## 11. Nicht enthalten

Keine Cloud-, KI-, Sprach-, OCR-, externe Suche. Keine Notification Engine-Erweiterung. Keine neuen Auth-Systeme.

## 12. Erweiterungsgarantie

Neue Suchquellen ausschließlich via `SearchProviderRegistry.register(descriptor)`. Neue Commands via `CommandRegistry.register(descriptor)`. Keine Änderungen in Manager oder UI notwendig.
