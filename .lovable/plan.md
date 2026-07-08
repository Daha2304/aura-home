
# Teil 5C — Dashboard Runtime

Vollständig eigenständige Runtime, strikt getrennt vom Editor. Nutzt Widget Registry, Widget Manager, Layout Engine, Dashboard Manager und Layouts Store unverändert. Registry-basiertes Rendering, Premium Glass Design, Framer Motion. Keine Smart-Home-Widgets.

## Architektur

```
src/services/runtime/
  RuntimeController.ts     Aktives Dashboard, aktueller Breakpoint, Overlay-State
  BreakpointDetector.ts    ResizeObserver + matchMedia → LayoutBreakpoint
  RuntimeEvents.ts         TypedEmitter: dashboardChanged, breakpointChanged, overlayChanged
  greetings.ts             Zeit-/Statusbasierte Hero-Inhalte (Guten Morgen, Alle Systeme online …)
  index.ts

src/store/slices/runtimeStore.ts
  activeDashboardId, breakpoint, theme (light|dark|auto), overlays[]
  Selektoren, keine Persistenz (Session-State)

src/hooks/runtime/
  useRuntimeDashboard.ts    Dashboard + Instanzen + Placements aus Stores
  useBreakpoint.ts          Reaktiver Breakpoint
  useWidgetInstance.ts      Einzelinstanz + Descriptor via Registry
  useVisibleWidgets.ts      Sichtbarkeits-/Viewport-Filter (Vorbereitung Virtualisierung)
  useRuntimeTheme.ts
  useSwipeNavigation.ts     Vorbereitung Dashboard-Swipe
  useRuntimeOverlays.ts

src/components/runtime/
  DashboardRuntime.tsx      Wurzelkomponente (nur Anzeige)
  RuntimeCanvas.tsx         Grid-Renderer aus LayoutEngine
  RuntimeWidgetHost.tsx     Nimmt WidgetInstance → resolve über widgetRegistry → dynamischer Render (Factory Pattern, keine switch/if-Ketten)
  RuntimeWidgetShell.tsx    Glass-Karte, Styling aus Instance
  RuntimeHeader.tsx         Dashboard-Titel, Datum, Uhr, „Bearbeiten"-Button
  RuntimePager.tsx          Vorbereitung Multi-Dashboard-Swipe (Framer Motion)
  RuntimeEmptyState.tsx     Illustration + Button „Dashboard bearbeiten"
  RuntimeSkeleton.tsx       Skeleton-Loading
  overlays/
    OverlayLayer.tsx        AnimatePresence-Manager
    DiscoveryOverlay.tsx  ServerOfflineOverlay.tsx  SyncOverlay.tsx
    AuthOverlay.tsx  UpdateOverlay.tsx
  glass/
    GlassSurface.tsx        Frosted / Liquid / Frost-Varianten
    GlassDivider.tsx

src/components/runtime/widgets/            System-Widgets (registry-registriert)
  WelcomeWidget.tsx
  DashboardHeaderWidget.tsx
  DashboardTitleWidget.tsx
  DateWidget.tsx
  ClockWidget.tsx
  ServerStatusWidget.tsx
  ConnectionStatusWidget.tsx
  DiscoveryStatusWidget.tsx
  SyncStatusWidget.tsx
  SystemInfoWidget.tsx
  AppVersionWidget.tsx
  UserProfileWidget.tsx        (vorbereitet)
  QuickActionsWidget.tsx       (vorbereitet)
  HeroGreetingWidget.tsx       (Guten Morgen / Willkommen zurück)
  HeroStatusWidget.tsx         (Alle Systeme online / Server verbunden / Sync erfolgreich / Discovery abgeschlossen)

src/services/widgets/builtin/system.ts     Registriert alle System-Widgets via defineWidget + render-Factory
src/services/widgets/builtin/index.ts      Ruft system.ts + placeholder-Registrierung auf

src/themes/
  glass.ts     Token-Presets (frosted / liquid / frost), Radius, Shadow
  motion.ts    Ergänzt runtime-spezifische Varianten (widgetFade, widgetScale, overlayFade, pagerSlide)
```

## Registry-basierter Renderer (Factory Pattern)

`WidgetDescriptor` erhält ein optionales, typisiertes Feld
`render?: (ctx: WidgetRenderContext) => ReactNode`. Beim Registrieren liefert
jedes System-Widget seinen Renderer mit; `RuntimeWidgetHost` liest den
Descriptor aus `widgetRegistry.get(instance.widgetType)` und ruft `render`
auf. Fehlt der Renderer (Placeholder-Widgets aus 5B), wird ein neutrales
`RuntimeMissingRenderer`-Tile gezeigt — keine `switch`/`if`-Kette.

`WidgetRenderContext` enthält: `instance`, `descriptor`, `breakpoint`,
`placement`, `theme`, `size` (Pixelmaße aus LayoutEngine).

## Navigation Editor vs Runtime

- `/_app/dashboards/$dashboardId` zeigt **ausschließlich die Runtime**
  (neue Komponente `DashboardRuntime`).
- Neuer Route: `/_app/dashboards/$dashboardId/edit` mountet den bestehenden
  Editor (EditorTopBar, DashboardCanvas, WidgetToolbox, PropertyEditor).
- Header-Button „Bearbeiten" navigiert per `<Link>` zum Edit-Route.
- Editor-`Fertig`-Button navigiert zurück zur Runtime.
- Keine Wiederverwendung von Editor-Komponenten in Runtime.

## Bootstrap-Dashboard

`dashboardManager.ensureBootstrapDashboard()` erhält zusätzlichen Aufruf
`ensureRuntimeDefaults(dashboard)`: legt Standard-Instanzen an (Header,
Clock, Date, Hero-Greeting, ServerStatus, ConnectionStatus,
SyncStatus, AppVersion) — nur wenn Dashboard leer ist.

## Runtime-Layout

- `RuntimeCanvas` nutzt `layoutEngine` (bereits vorhanden) zur Umrechnung
  Placement→CSS-Grid, exakt wie im Editor, jedoch read-only.
- Reaktion auf `breakpoint` aus `BreakpointDetector` (matchMedia +
  ResizeObserver auf dem Runtime-Container) — separate Layouts für
  phone-portrait/landscape, tablet-portrait/landscape, desktop.
- Nur sichtbare Widgets werden gemountet (`visible === true`); Vorbereitung
  Virtualisierung: `useVisibleWidgets` liefert IntersectionObserver-Hook,
  gerendert werden vorerst alle mit `content-visibility: auto`.

## Glass Design

- `GlassSurface` in Varianten `frosted` (backdrop-blur-xl + bg-white/30),
  `liquid` (Gradient + Noise), `frost` (Highlight-Border).
- Tokens ergänzen `src/styles.css` (semantische Layer, kein Hard-Coded
  White/Black — nur `bg-background/…`, `border-white/…` via Utility-
  Klassen im semantischen Rahmen).
- Grosse Radien (`rounded-3xl`), sanfte Shadows (`shadow-elegant`).

## Animationen

Framer Motion-Varianten in `themes/motion.ts` (ergänzt): `widgetFade`,
`widgetScale`, `overlayFade`, `pagerSlide`. `AnimatePresence` für Overlays
und Pager. `LayoutGroup` für Widget-Positionswechsel bei
Breakpoint-Wechsel.

## Overlays / Status Layer

`OverlayLayer` mountet auf App-Ebene innerhalb der Runtime. Overlays
werden vom `runtimeStore` gesteuert und aus vorhandenen Stores gespeist:
- Discovery: `discoveryStore`
- Server offline: `connectionStore`
- Sync: `commandsStore` / `historyStore`
- Auth: `usersStore`/settings
- Update: `settingsStore`

Keine Business-Logik-Änderungen, nur Konsum bestehender Signale.

## Theme

`useRuntimeTheme` liest `settingsStore.theme`, mapped auf
`document.documentElement.dataset.theme`. Dynamic Theme via
`prefers-color-scheme`.

## Empty State

Wenn Dashboard 0 sichtbare Widgets hat: SVG-Illustration inline (keine
Bilddatei), Text „Dieses Dashboard ist leer", Button navigiert zu
`/dashboards/$id/edit`.

## Performance

- `React.memo` auf `RuntimeWidgetHost`, `RuntimeWidgetShell`.
- `useSyncExternalStore`-Selektoren aus Zustand mit stabilen Slices.
- `React.lazy` für System-Widgets (Chunk per Kategorie).
- `content-visibility: auto` auf Widget-Karten.
- Keine Prop-Objekt-Neuanlagen in Render-Pfaden (`useMemo`).

## Verifikation

`bunx tsgo --noEmit`, dann Playwright: Route `/dashboards/<id>` zeigt
Runtime (kein Editor sichtbar), Button „Bearbeiten" führt zu
`/edit`-Variante, Bootstrap-Widgets werden gerendert.

## Bewusst NICHT enthalten

Keine Smart-Home-Widgets, keine Geräte-/Raum-/Szenen-/Kamera-/Chart-
Widgets, keine Editor-Funktionalität in der Runtime, keine Änderungen an
Registry/Manager/LayoutEngine-Signaturen (nur additives `render?`-Feld
im Descriptor).
