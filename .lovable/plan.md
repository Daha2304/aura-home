## Teil 6A – Design System + Room Management

Aufbauend auf existierender Architektur (bestehende `roomsStore`, `RoomCard`, `glass/*`, `runtime`, `widgetRegistry`, `dashboardManager`). Nichts wird ersetzt – alles wird erweitert.

### 1. Design Tokens (`src/themes/`)
Zentrale Tokens als TS-Konstanten + CSS-Variablen-Erweiterung in `src/styles.css`:
- `themes/tokens.ts` — colors, blur, shadows, radii, spacing, typography scale, glass intensity, motion duration, icon sizes
- `themes/motion.ts` — Erweiterung: spring, fade, scale, swipe, hover, touch presets (Framer Motion Variants)
- `styles.css` — zusätzliche CSS-Variablen (`--glass-blur-sm/md/xl`, `--shadow-glass-*`, `--radius-hero`, `--motion-spring`)

### 2. Design-System Komponenten (`src/components/ds/`)
Alle als reine Präsentations-Komponenten mit `cva`-Varianten. Wo eine Basis existiert (`GlassCard`, `GlassButton`), werden Wrapper darauf aufgebaut, ohne die Originale zu entfernen.

Cards: `GlassCard` (Re-Export/Erweiterung), `HeroCard`, `SectionCard`, `StatusCard`, `MetricCard`, `ActionCard`, `RoomCard` (Re-Export bestehender + neue Variante `RoomHeroCard`), `InfoCard`, `EmptyStateCard`, `LoadingCard`, `SkeletonCard`, `DialogCard`, `BottomSheet`.

Controls: `GlassButton` (Re-Export), `IconButton`, `FloatingButton`, `SegmentedControl`, `StatusBadge`, `GlassInput`, `GlassSwitch`, `GlassSlider`, `GlassListItem`.

Barrel: `src/components/ds/index.ts`.

### 3. Animation Framework (`src/components/ds/motion/`)
- `PageTransition.tsx`, `HeroTransition.tsx`, `CardTransition.tsx`
- `SharedLayout.tsx` (Wrapper um `LayoutGroup` mit stabilen `layoutId`-Konventionen: `room-hero-${roomId}`)
- `TouchFeedback.tsx` (whileTap/whileHover Wrapper)
- Vorbereitung Shared-Element Dashboard → RoomCard → RoomDetail über `layoutId`.

### 4. Room Model Erweiterung (`src/models/room.ts`)
Erweitern (nicht ersetzen) um: `description?`, `category?` (= erweiterte `RoomType`), `favorite?: boolean`, `tags?: string[]`, `status?: RoomStatus`, `customProps?: Record<string, unknown>`. `RoomType` erweitern: `dining`, `kids`, `wc`, `stairway`, `garden`, `terrace`, `balcony`, `laundry`, `technical`, `other`. Bestehende Werte bleiben erhalten.

Neu: `src/models/roomCategory.ts` (Katalog aus Icon, Farbvorschlag, Default-Name, Sort-Group), `src/models/roomEvents.ts`.

### 5. Room Registry (`src/services/rooms/`)
- `RoomRegistry.ts` — plugin-fähiger Katalog von Raumtypen (`registerRoomType`, `getRoomType`, `listRoomTypes`), pre-registriert mit den 18 Typen.
- `RoomManager.ts` — CRUD: `create/update/delete/move/reorder/duplicate`, `export/import` (JSON), `mergePrepare` (nur Vorbereitung), delegiert an `roomsStore`. Persistenz via bestehender Storage-Layer.
- `RoomEvents.ts` — `TypedEmitter` (`roomCreated`, `roomUpdated`, `roomDeleted`, `roomsReordered`).
- `index.ts` (Barrel).

Bootstrap: `services/bootstrap.ts` erweitern → `roomRegistry` initialisieren.

### 6. Room Store Erweiterung
`store/slices/roomsStore.ts` behält Signatur, wird ergänzt um:
- Selectors: `selectRoomById`, `selectRoomsSorted`, `selectFavoriteRooms`, `selectRoomsByFloor` — memoisiert via `zustand` shallow + `useMemo`-Selectors in `hooks/rooms/`.
- Index-Map `byId` für O(1)-Lookup (intern; API abwärtskompatibel).
- Actions: `reorder`, `toggleFavorite`, `setRooms` (bereits vorhanden), `merge` Vorbereitung.

### 7. Room Widgets (System-Registrierung)
Neue Widget-Descriptors via `widgetRegistry.register` (analog zu `system.tsx`):
- `room.overview`, `room.hero`, `room.status`, `room.summary` — verwenden `useRoomsStore`, zeigen Platzhalter-Metriken (Geräteanzahl = 0, wird in 6B/7 real gefüllt).
Datei: `src/services/widgets/builtin/rooms.tsx`, registriert in `builtin/index.ts`.

### 8. Routen / UI
- `_app.rooms.tsx` — neue Übersicht: `HeroCard` (Header, Discovery-Status), Grid aus `RoomCard`s (Shared-Layout `layoutId="room-card-${id}"`), Empty-State, FAB „Raum erstellen" (`BottomSheet` mit `RoomForm`).
- `_app.rooms.$roomId.tsx` — Detail: `HeroCard` mit Raumbild/Farbe/Icon, `MetricCard`s (Geräteanzahl 0, Online 0, Offline 0, Favoriten 0), `StatusCard` (Discovery), Placeholder-Slot „Geräte folgen in Teil 6B/7". Edit-Sheet + Delete-Confirm.
- Beide nutzen ausschließlich `components/ds/*`.

Formulare: `components/rooms/RoomForm.tsx` (BottomSheet-Content) mit Icon-Picker, Farb-Picker, Typ-Picker, Etage, Tags.

### 9. Performance & A11y
- Grid virtualisiert vorbereitet (Wrapper `VirtualGrid` als No-Op-Placeholder → später ersetzbar).
- `React.memo` auf allen DS-Cards, `useMemo` für Listen-Selectors.
- `content-visibility: auto` auf Karten außerhalb Viewport.
- Alle Buttons ≥ 44×44, `aria-label` auf IconButtons, sichtbare Focus-Ringe über `--ring`.

### Nicht enthalten
Keine Gerätesteuerung, keine Szenen, keine echten Metriken, keine Diagramme, keine Automationen.

### Verifikation
- `bunx tsgo --noEmit`
- Manueller Klickpfad `/rooms` → Create → Detail → Edit → Delete
- Screenshot Empty-State + gefüllte Liste + Detail via Playwright
