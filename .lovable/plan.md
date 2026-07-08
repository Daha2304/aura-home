## Teil 6B – Device Catalog (Plan)

Ziel: Live Geräteübersicht auf Basis vorhandener Discovery, Intelligence Layer, Device Registry, Widget Registry, Room Manager, Design System. Keine Steuerung, keine Mockdaten, keine neuen Datenmodelle.

### 1. Device Registry (neu, plugin-basiert)
`src/services/devices/registry/`
- `DeviceRegistry.ts` – Map<type, DevicePresentation> mit `register`, `resolve`, `resolveByCapability`, Fallback-Presenter.
- `DevicePresentation` (Model): `{ type, category, icon, label, accent, tags, renderCard?, renderHero?, renderDetail? }`.
- `builtin/` Presenter für vorhandene Discovery Typen (light, switch, sensor, climate, cover, outlet, generic) – nur Darstellung, keine Steuerung.
- `bootstrap()` registriert Builtins, in `src/services/bootstrap.ts` nach Intelligence.
- Keine Switch/if-Ketten im UI – alles über Registry.

### 2. Device Renderer (Factory)
`src/components/devices/renderer/`
- `DeviceRenderer.tsx` – zieht Presenter aus Registry, delegiert an `renderCard/renderHero/renderDetail`, Fallback = `GenericDeviceCard`.
- `DeviceIconRenderer.tsx`, `DeviceStatusRenderer.tsx` – gemeinsame Bausteine, gespeist aus Intelligence + Discovery events.

### 3. Device Catalog UI
`src/components/devices/catalog/`
- `DeviceCatalog.tsx` – Root: Header (Suche, Ansicht, Sort, Gruppierung, Filter), Content (Grid/List), Empty/Loading.
- `DeviceCatalogToolbar.tsx` – Segmented Controls (Design System) für View-Mode und Grouping, IconButton für Filter-BottomSheet.
- `DeviceCatalogSearch.tsx` – debounced (150 ms) via `intelligence.search`.
- `DeviceCatalogFilters.tsx` – BottomSheet aus DS, arbeitet mit `DeviceFilterEngine` Prädikaten.
- `DeviceCatalogGroups.tsx` – gruppiert nach Raum/Kategorie/Typ/Hersteller/Status/Favorit/Tags/Capability/Custom via Selector.
- `DeviceCatalogGrid.tsx` – Varianten: `grid`, `list`, `compact`, `large`. Auto-Breakpoint via `useBreakpoint`.
- `DeviceCatalogItem.tsx` – nutzt `DeviceRenderer`, umhüllt in DS `Card`.
- Virtualisierung via `@tanstack/react-virtual` (bereits im Stack – falls nicht: `bun add @tanstack/react-virtual`).

### 4. Device Card (Presentation)
`src/components/devices/cards/`
- `DeviceCardLarge.tsx`, `DeviceCardCompact.tsx`, `DeviceCardList.tsx` – nur DS-Komponenten (`Card`, `MetricCard`, `StatusBadge`, `GlassSurface`).
- Anzeige: Icon, Name, Raum, Kategorie, Online, Signal, Batterie, Favorit, Tags, Capabilities, letzte Aktivität, Discovery-Status, Warnungen/Fehler.
- Framer-Motion `layout` + `AnimatePresence` für Status-Übergänge.

### 5. Filter / Sort / Group Layer
`src/services/devices/catalog/`
- `DeviceCatalogEngine.ts` – reiner Selector: `(devices, roomMetrics, filters, sort, group) → GroupedDevices`. Nutzt `DeviceFilterEngine`, `SearchIndex`, `RoomManager`, `intelligenceEvents`.
- Sort-Strategien pluginfähig: `sortStrategies.ts` (name, room, category, lastActive, signal, battery, manufacturer, firmware, custom).
- Group-Strategien pluginfähig: `groupStrategies.ts`.
- Speicherung Ansicht/Sort/Gruppierung in neuem Slice `deviceCatalogStore.ts` (persist).

### 6. Favorites + Tags
- Favorite Toggle via `DeviceAssignmentEngine` (bereits vorhanden → optionale `setFavorite` Methode dort ergänzen, kein neues Modell).
- Tags nutzen bestehendes `device.tags`; farbige Chips via DS `Tag` (falls fehlend → in DS als `Tag.tsx` ergänzen).

### 7. Quick Actions (nur Vorbereitung)
`src/components/devices/quick/DeviceQuickActions.tsx`
- DS `BottomSheet` mit Einträgen Details / Favorit / Raum ändern / Tags / Info. Handler nur navigate + assignment; keine Gerätesteuerung.

### 8. Device Detail
`src/routes/_app.devices.$deviceId.tsx` (bereits vorhanden → erweitern, nicht ersetzen)
- Hero via `DeviceRenderer.renderHero` + `HeroCard` (Shared Layout ID = `device-{id}`).
- Sections: Identität (Hersteller/Modell/UUID/MAC/Firmware/Hardware/Software), Capabilities, Tags, Signal/Battery, Discovery-Status, History-Placeholder (leere `SectionCard`).

### 9. Room-Seite Integration
- `_app.rooms.$roomId.tsx` bekommt Live-Geräteabschnitt: Liste + Metrik-Cards (Geräte, Online, Offline, Warnungen, Favoriten) aus `roomMetricsStore` (bereits berechnet). Nur Ergänzung, keine Struktur-Änderung.

### 10. Dashboard-Widgets (Widget Registry)
Neue Builtins in `src/services/widgets/builtin/devices.tsx`:
- `device.count`, `device.online`, `device.offline`, `device.favorites`, `device.latest`, `device.discoveryStatus`, `room.summary` (falls noch nicht vorhanden).
Registrierung nur über bestehende Widget Registry, subscribes auf `intelligenceEvents`/`discoveryEvents`.

### 11. States & Feedback
- `DeviceCatalogEmpty.tsx` (keine Geräte, Discovery läuft, Server offline, kein Netz, keine Ergebnisse) – nutzt DS `EmptyStateCard`.
- `DeviceCatalogSkeleton.tsx` – DS `SkeletonCard` + Shimmer.

### 12. Live-Updates
- Alle Komponenten selectieren via Zustand + `intelligenceEvents`. Kein Polling, keine Refresh-Buttons.
- Debounced Store-Updates via existierende Events; UI reagiert automatisch.

### 13. Performance
- `React.memo` auf Card-Komponenten, `useMemo` für Gruppen, Selectors mit shallow, `react-virtual` für lange Listen, Code-Split der Detail-Route.

### 14. Route-Änderungen
- `_app.devices.tsx`: alte Ad-hoc-Filter-Logik durch `<DeviceCatalog />` ersetzen (Legacy `DeviceList` bleibt fallback-frei entfernt, sofern nirgends sonst genutzt – Grep prüft).
- `_app.devices.$deviceId.tsx`: erweitert.

### 15. Bootstrap
`src/services/bootstrap.ts`: `bootstrapDeviceRegistry()` nach `bootstrapIntelligence()`, vor Widgets.

### Nicht enthalten
Keine Schalter/Dimmer/RGB/Rollo/Thermostat/Szenen/Automationen. Keine Command-Queue-Aufrufe. Keine Mockdaten.

### Verifikation
- `bunx tsgo --noEmit`
- Playwright: `/devices` lädt, Toolbar reagiert (View/Sort/Group), Suche filtert, `/devices/$id` zeigt Hero + Sections, `/rooms/$id` zeigt Live-Zähler, Dashboard zeigt neue Widgets.
