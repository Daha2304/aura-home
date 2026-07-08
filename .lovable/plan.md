
# Smart Home PWA – Grundgerüst

Ziel: Ein vollständiges, produktionsreifes Architektur-Skelett mit iOS-artigem Glassmorphism-Design, allen Seiten, Bottom-Navigation, Stores, Models und Service-Interfaces. Noch keine Geräte-Logik, kein echter WebSocket-Traffic.

## Tech-Stack (Template-konform)

- TanStack Start (bereits im Projekt) + file-based Routing unter `src/routes/`
- TypeScript, TailwindCSS v4 (Design-Tokens in `src/styles.css`)
- TanStack Query (bereits konfiguriert im Router-Context)
- Zustand für globalen Client-State (mit `persist` Middleware)
- Framer Motion für Animationen
- Lucide React für Icons (bereits vorhanden)
- PWA: Manifest-only Home-Screen-Support (`public/manifest.webmanifest` + Head-Tags). Kein Service Worker im Grundgerüst – gemäß Lovable-Preview-Regeln.

Hinweis: React Router wird nicht zusätzlich eingebunden – TanStack Router ist der Router. Das entspricht der Projektkonvention und vermeidet doppeltes Routing.

## Ordnerstruktur

```text
src/
  routes/
    __root.tsx                     # Shell + Head + Providers
    _app.tsx                       # Layout mit Bottom-Nav + <Outlet/>
    _app.index.tsx                 # /  → Dashboard
    _app.rooms.tsx                 # /rooms
    _app.rooms.$roomId.tsx         # /rooms/:roomId
    _app.devices.tsx               # /devices
    _app.devices.$deviceId.tsx     # /devices/:deviceId
    _app.scenes.tsx                # /scenes
    _app.automations.tsx           # /automations
    _app.statistics.tsx            # /statistics
    _app.settings.tsx              # /settings (Layout)
    _app.settings.index.tsx        # Übersicht
    _app.settings.server.tsx
    _app.settings.users.tsx
    _app.settings.appearance.tsx
    _app.settings.language.tsx
    _app.settings.backup.tsx
    _app.settings.notifications.tsx
    _app.settings.developer.tsx
  components/
    layout/
      AppShell.tsx
      BottomNav.tsx
      PageHeader.tsx
      SafeArea.tsx
    ui/                            # bestehende shadcn-Primitives bleiben
    glass/
      GlassCard.tsx
      GlassPanel.tsx
      GlassSheet.tsx
      GlassButton.tsx
      BlurBackdrop.tsx
    dashboard/
      WidgetGrid.tsx
      WidgetContainer.tsx
      widgets/
        FavoritesWidget.tsx
        QuickActionsWidget.tsx
        StatusWidget.tsx
        RoomsWidget.tsx
        ScenesWidget.tsx
        EnergyWidget.tsx
        ClimateWidget.tsx
        SecurityWidget.tsx
    rooms/
      RoomCard.tsx
      RoomList.tsx
      RoomIcon.tsx
    devices/
      DeviceCard.tsx
      DeviceList.tsx
      DeviceIcon.tsx
      DeviceStatusBadge.tsx
      controls/                    # nur leere Kontrakt-Komponenten
        ControlRegistry.tsx
        LightControl.tsx
        DimmerControl.tsx
        RgbControl.tsx
        SwitchControl.tsx
        SensorControl.tsx
        ThermostatControl.tsx
        BlindsControl.tsx
        MediaControl.tsx
        CameraControl.tsx
        GenericControl.tsx
    scenes/SceneCard.tsx
    automations/AutomationCard.tsx
    common/
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
      Icon.tsx
      SectionTitle.tsx
      Toggle.tsx
      Sheet.tsx
  hooks/
    useTheme.ts
    useHydrated.ts
    useHapticFeedback.ts
    useSafeArea.ts
    useMediaQuery.ts
    useWebSocketStatus.ts          # nur Interface, keine Verbindung
  services/
    websocket/
      WebSocketClient.ts           # Klasse mit Interface, keine Impl.
      types.ts                     # Message/Event-Typen
      reconnect.ts                 # Kontrakt
      heartbeat.ts                 # Kontrakt
      queue.ts                     # Kontrakt
      subscriptions.ts             # Kontrakt
      index.ts
    discovery/
      DiscoveryService.ts          # Kontrakt
      types.ts
    storage/
      localStorage.ts
      backup.ts
    i18n/
      i18n.ts
      locales/{de,en}.ts
  store/
    index.ts
    slices/
      uiStore.ts                   # Theme, Sprache, Nav-Zustand
      dashboardStore.ts            # Widget-Layout, Favoriten
      roomsStore.ts                # nur Struktur, kein Seed
      devicesStore.ts              # nur Struktur, kein Seed
      scenesStore.ts
      automationsStore.ts
      settingsStore.ts             # Server, Entwicklermodus, Notif.
      usersStore.ts                # Rollen: admin/user/guest
      connectionStore.ts           # WS-Status
  models/
    common.ts                      # ID, Timestamp, Color, Icon
    room.ts
    device.ts                      # Device + DeviceType + Capability
    capability.ts                  # Light, Dimmer, RGB, Sensor, ...
    scene.ts
    automation.ts
    user.ts                        # Rollen
    server.ts                      # WS-Server-Konfig
    widget.ts                      # Widget-Typen und Layout
    events.ts                      # WS-Events
  themes/
    tokens.ts                      # semantische Farb-Tokens
    glass.ts                       # Blur-/Shadow-Presets
    motion.ts                      # Framer-Motion-Presets
  utils/
    cn.ts (vorh.)
    format.ts
    color.ts
    ids.ts
    guards.ts
  styles.css                       # Design-Tokens + Glass-Utilities
public/
  manifest.webmanifest
  icons/ (Platzhalter-Pfade nur wenn Assets generiert werden)
```

## Design-System

`src/styles.css` erweitern:
- Zwei Theme-Sets (`:root` = light, `.dark`) mit oklch-Tokens: `--background`, `--foreground`, `--surface`, `--surface-elevated`, `--glass-bg`, `--glass-border`, `--glass-highlight`, `--accent` (dynamisch), Semantik-Farben (success/warning/danger/info), `--radius` (18px Basis, iOS-nah).
- `@theme inline` mappt Tokens auf Tailwind-Utilities.
- `@utility glass-card`, `glass-panel`, `glass-nav`, `glass-sheet` mit `backdrop-filter: blur(...) saturate(180%)`, halbtransparentem Background, feiner Innen-/Außenkontur und weichem Schatten. Nur Standard-Property (Lightning CSS setzt Präfixe).
- Typografie: SF-Pro-nahe Systemschrift via `font-family: -apple-system, "SF Pro Display", "Inter", ...`. Kein Remote-`@import`; falls Inter nötig, `<link>` in `__root.tsx`.
- Dynamic Colors: Accent-Token pro Raum/Gerät als CSS-Variable auf Kartenebene setzbar.
- Auto-Theme: `useTheme` respektiert `prefers-color-scheme` und ein UI-Store-Override (`system` | `light` | `dark`).

Framer-Motion-Presets (`themes/motion.ts`):
- `springSoft`, `springSnappy`, `fadeSlideUp`, `scalePress` (iOS-Tap-Feedback), Page-Transitions.

## Navigation

`_app.tsx` rendert `<AppShell>` mit:
- Top-Bereich: `PageHeader` (großer Titel, iOS-Large-Title-Stil, kondensiert beim Scrollen – via IntersectionObserver-Hook).
- `<Outlet/>` als Scroll-Container mit `pb-safe` für Bottom-Nav.
- `BottomNav`: 7 Tabs mit Icons + Label, aktive Pille mit Layout-Animation (`layoutId`), Glass-Hintergrund, Haptic-Hook-Aufruf beim Tap. Overflow-Design: entweder scrollbare Tab-Leiste oder 6 Tabs + „Mehr". Empfehlung: `Dashboard, Räume, Geräte, Szenen, Automationen, Mehr` (Statistik + Einstellungen unter „Mehr") auf schmalen Geräten; alle 7 auf breiteren. Genau geklärt: siehe offene Frage unten.

## State-Management

Zustand-Slices mit `persist` (localStorage) für: `uiStore`, `dashboardStore` (Widget-Reihenfolge/Sichtbarkeit/Favoriten), `settingsStore`, `usersStore`. Nicht persistent: `connectionStore`.

Stores enthalten Actions + Selektoren, aber **keine Seed-Daten**. `rooms`, `devices`, `scenes`, `automations` starten als leere Arrays; Leerzustände zeigen `EmptyState`.

## Models (Auszug)

- `DeviceType`: Union aller Typen aus der Anforderung.
- `Capability`: diskriminierte Union (`onOff`, `dimmer`, `rgb`, `temperature`, `humidity`, `position`, `mode`, `mediaTransport`, `stream`, `energy`, `custom`).
- `Device`: `{ id, name, type, roomId?, capabilities: Capability[], online, lastSeen, meta }`.
- `Room`: `{ id, name, icon, color, image?, floor?, type, order }`.
- `Widget`: `{ id, type, size: 'sm'|'md'|'lg'|'xl', visible, order, config }`.
- `User`: `{ id, name, role: 'admin'|'user'|'guest' }`.
- `ServerConfig`: `{ id, name, url, ssl, auth: {...} }`.
- `WsEvent`: diskriminierte Union.

## Services (nur Kontrakte)

- `WebSocketClient`: TypeScript-Klasse mit Methodensignaturen `connect`, `disconnect`, `send`, `subscribe`, `on`, plus interne (leere) Hooks für Reconnect/Heartbeat/Queue. Wirft `NotImplemented` bei Aufruf – wird später ersetzt.
- `DiscoveryService`: Interface für `startDiscovery`, `stopDiscovery`, `assignRoom`, `refresh`, `remove`.
- `storage/backup.ts`: Kontrakt für Import/Export als JSON.

Keine Netzwerkaufrufe im Grundgerüst.

## Seiten – Inhalt im Grundgerüst

Alle Seiten rendern Header + Empty-/Skeleton-Zustand und ihre Struktur:
- **Dashboard**: `WidgetGrid` mit den vorgesehenen Widgets, alle im „leer, wartet auf Verbindung"-Zustand; Bearbeiten-Modus schaltet Verschieben (drag via Framer Motion `Reorder`) und Sichtbarkeit frei.
- **Räume**: Grid aus `RoomCard`s, „+"-Button öffnet `GlassSheet` (nur UI, kein Save-Backend).
- **Geräte**: Filter (nach Raum/Typ/Status), Liste `DeviceCard`; Detailseite zeigt Capability-Registry-Slots.
- **Szenen / Automationen / Statistik**: Header + leere Listen + „Neu"-CTA + strukturelle Platzhalter-Komponenten (keine Fake-Daten).
- **Einstellungen**: Verschachteltes Layout mit Untermenüs; jede Unterseite besitzt bereits ihre finalen Sections und Toggles/Inputs, gebunden an `settingsStore`.

## PWA

- `public/manifest.webmanifest` mit `name`, `short_name`, `theme_color`, `background_color`, `display: "standalone"`, `start_url: "/"`, `icons` (Pfade referenziert; Icons später).
- `__root.tsx` bekommt `manifest`, `theme-color`, `apple-mobile-web-app-capable`, `apple-touch-icon` Links/Meta.
- Kein Service Worker (Anforderung „PWA / offlinefähig" wird im Grundgerüst über persistenten Store + Manifest abgedeckt; echter Offline-Cache wird später gemäß PWA-Skill mit `vite-plugin-pwa` in einer separaten Iteration ergänzt).

## Head-Metadaten

`__root.tsx`: Title „Smart Home", Description „Steuere dein Zuhause – schnell, privat, elegant.", passende OG/Twitter-Meta. Kein `og:image` im Root.

## Was NICHT im Grundgerüst enthalten ist

- Keine echte WebSocket-Verbindung, kein Reconnect-Timer, keine Discovery-Logik.
- Keine Beispiel-Räume/-Geräte/-Szenen.
- Keine echten Diagramme (nur Container + leere Zustände).
- Keine Auth-Flows – nur Rollen-Modell und UI-Skeleton.

## Technische Details

- Route-Struktur nutzt Pathless-Layout `_app` mit `<Outlet/>`, damit Bottom-Nav auf allen App-Seiten persistent bleibt.
- Alle Route-Komponenten sind **nicht exportiert** (Code-Splitting-Regel des Templates).
- Framer Motion Page-Transitions über `AnimatePresence` im `_app`-Layout, mit `useRouterState` zum Umschalten per `location.pathname`.
- `usePersist` via Zustand + `createJSONStorage(() => localStorage)`, Hydration-sicher über `useHydrated`.
- Tailwind v4 Regeln strikt eingehalten (keine `tailwind.config.js`, keine `@tailwind` Direktiven, `@utility` für Custom-Utilities, `@theme inline` fürs Token-Mapping).

## Offene Frage vor Umsetzung

Auf schmalen Handys sind 7 gleichwertige Bottom-Tabs unruhig und untypisch für iOS-Ästhetik. Bevorzugst du:

1. **5 Haupt-Tabs + „Mehr"-Sheet** (iOS-Standard): Dashboard, Räume, Geräte, Szenen, Mehr → Automationen/Statistik/Einstellungen im Sheet. Sauberste UX.
2. **Alle 7 Tabs sichtbar**, horizontal scrollbar wenn zu eng. Näher an deiner Vorgabe, weniger iOS-typisch.
3. **6 Tabs + Einstellungen als Zahnrad im Header** (Statistik bleibt Tab).

Sag mir kurz welche Variante – dann setze ich das Grundgerüst genau so um.
