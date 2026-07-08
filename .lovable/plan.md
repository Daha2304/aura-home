
# Teil 5A – Dashboard Engine & Widget Framework

Reine Architekturebene. Keine sichtbaren Widgets, keine Dashboard-UI, keine Geräteanzeige. Bestehender `dashboardStore` (nur `widgets`/Favorites) und `models/widget.ts` bleiben lauffähig und werden schrittweise auf das neue System gehoben — nichts wird gelöscht oder verschlechtert.

## 1. Neue Models (`src/models/`)

- `dashboard.ts` – `Dashboard`, `DashboardId`, `DashboardVisibility`, `DashboardBackground`, `DashboardTags`, `DashboardMeta`
- `layout.ts` – `LayoutBreakpoint` (`phone-portrait` | `phone-landscape` | `tablet-portrait` | `tablet-landscape` | `desktop`), `LayoutGrid`, `LayoutMode` (`grid` | `snap` | `free` | `responsive`), `WidgetPlacement` (`gridX`, `gridY`, `w`, `h`, `zIndex`, `rotation?`)
- `widgetInstance.ts` – `WidgetInstance` (id, widgetType, title/subtitle, icon, placement pro Layout, layer, visibility, styling: color/theme/padding/margin/radius/shadow/blur/opacity, animation, refreshInterval, dataSource, config, lifecycle, custom)
- `widgetDescriptor.ts` – `WidgetDescriptor` (name, category, description, icon, defaultSize, minSize, maxSize, supportedLayouts, settingsSchema, capabilities, version, factory)
- `widgetCategory.ts` – Enum-Union (`favorites` | `devices` | `rooms` | `scenes` | `automations` | `media` | `energy` | `climate` | `sensors` | `cameras` | `statistics` | `charts` | `system` | `custom`)
- `widgetLifecycle.ts` – Union (`new` | `loading` | `ready` | `updating` | `error` | `hidden` | `disabled` | `deleted`)
- `widgetAnimation.ts` – Union (`none` | `fade` | `scale` | `slide` | `blur` | `glass` | `spring`)
- `dashboardEvents.ts` – Event-Payload-Typen
- `models/index.ts` – neue Exports einhängen; alter `Widget`-Typ bleibt als Legacy-Alias erhalten.

## 2. Widget Registry (`src/services/widgets/`)

- `WidgetRegistry.ts` – Singleton, Map-basiert (O(1)), `register(descriptor)`, `unregister`, `get`, `list`, `listByCategory`, `has`, `versions`. Duplicate/Version-Konflikte → `errorBus`.
- `WidgetDescriptor.ts` – Helper `defineWidget()` für typsichere Registrierung, `createInstance(descriptor, overrides)`.
- `builtin/index.ts` – vorbereitete leere Kategorie-Buckets; **noch keine echten Widgets registrieren** (nur Platzhalter-Descriptors optional weglassen). Reine Pluginschnittstelle.
- `events.ts` – `widgetEvents` Emitter (`registered`, `unregistered`).
- `index.ts` – Public API.

## 3. Widget Manager (`src/services/widgets/WidgetManager.ts`)

Verwaltet Instanzen unabhängig vom Dashboard:
- `create(widgetType, overrides)`, `update`, `remove`, `duplicate`
- `move(instanceId, layout, placement)`, `resize`
- Lifecycle-Transitions (FSM analog `LifecycleMachine`)
- Import/Export (JSON), Versionierung, Migrationssystem (`migrations/v1_to_v2.ts` Skeleton)
- Reagiert nicht auf UI; feuert Events über `dashboardEvents`.

## 4. Dashboard Manager (`src/services/dashboards/DashboardManager.ts`)

- `create`, `remove`, `duplicate`, `import`, `export`, `activate`, `switch`, `reorder`, `update`
- Verwaltet aktive Dashboard-ID
- Emittiert: `dashboardCreated|Deleted|Updated|Selected`, `widgetCreated|Deleted|Moved|Resized|Updated`, `layoutChanged`
- Delegiert Widgets an `WidgetManager`.

## 5. Layout Engine (`src/services/dashboards/LayoutEngine.ts`)

Vorbereitung (keine Rendering-Logik):
- Grid-Berechnung, Snap, Kollisionserkennung (Skelett), Responsive-Mapping zwischen Breakpoints
- Utility `resolvePlacement(instance, breakpoint)` mit Fallback-Kaskade
- `autoFit(size, grid)`

## 6. Persistenz (`src/services/dashboards/DashboardCache.ts`)

- Versioniertes LocalStorage-Schema (`SCHEMA_VERSION`, `migrate()`)
- Debounced Persist analog `DeviceCache`
- Getrennt gespeichert: Dashboards, Widget-Instanzen, Layouts pro Breakpoint.

## 7. Stores (`src/store/slices/`)

Neue Slices (Zustand + persist mit versionierten migrations):
- `dashboardsStore.ts` – `Map<DashboardId, Dashboard>`, `order`, `activeId`, Selectors (`byId`, `favorites`, `visible`)
- `widgetInstancesStore.ts` – `Map<InstanceId, WidgetInstance>`, `byDashboard`, `byType`, `byLifecycle`
- `layoutsStore.ts` – `Map<DashboardId, Record<Breakpoint, LayoutGrid>>`
- `widgetRegistryStore.ts` – reaktiver Snapshot der Registry (analog `registryStore`)

Bestehender `dashboardStore.ts` bleibt bestehen und wird intern als Legacy-Adapter markiert (nicht entfernt); neue Screens verwenden ausschließlich die neuen Slices.

## 8. Events (`src/services/dashboards/DashboardEvents.ts`)

Öffentlicher `dashboardEvents` Emitter mit exakt den geforderten Events. Subscriptions unabhängig von React.

## 9. Bootstrap-Integration

`src/services/bootstrap.ts`: nach Registry/Discovery-Init zusätzlich:
- `widgetRegistry.hydrateBuiltin()` (leer, aber ruft Plugin-Hook)
- `dashboardCache.load()` → Stores hydratisieren
- Keine Widgets erzeugen, keine Default-Dashboards (nur wenn Cache leer: ein leeres „Home"-Dashboard als Platzhalter, keine Widgets).

## 10. Performance

- Alle Lookups über `Map` (O(1))
- Selectors mit `zustand`-`shallow`, memoisierte Derivate
- Keine React-Komponenten in diesem Schritt.

## Nicht enthalten (explizit)

- Keine echten Widget-Implementierungen (Licht, Klima, Kamera, …)
- Keine Dashboard-UI/Routes/Editor
- Keine Änderungen am Onboarding, an Discovery oder am WebSocket-Layer
- Keine Löschung bestehender Legacy-Strukturen.

## Verifikation

- `bunx tsgo --noEmit` grün
- `bootstrap` läuft ohne Fehler, Cache Round-Trip getestet via kleinem Dev-Log
- Registry akzeptiert Test-Descriptor via Plugin-API (nur intern verifiziert, nicht gerendert).
