
# Teil 15 von 18 — Produktionsreife (Stabilität, Performance, Qualität)

Rein additiv. Keine neuen Fachfunktionen, keine neue Architektur, keine parallelen Datenmodelle. Alles läuft über bestehende Systeme (WebSocketManager, DiscoveryEngine, DeviceRegistry, CapabilityRegistry, DashboardManager, WidgetRegistry, RoomManager, SceneManager, GroupManager, AutomationEngine, Timeline, NotificationRegistry, SearchManager, UserManager, PWA/Update/Backup/Version/Cache/Offline/Lifecycle, ErrorBus, Logger, Stores).

## 1. Performance-Audit & -Optimierungen (nicht-funktional)

- Bestehende Hot-Path-Komponenten mit React.memo/useMemo/useCallback stabilisieren:
  DashboardRuntime, RuntimeCanvas, RuntimeWidgetHost, WidgetGrid, WidgetContainer,
  RoomCard, SceneCard, GroupCard, AutomationCard, GlassListItem, ToastHost,
  CommandPalette-Ergebnisliste.
- Zustand-Selektoren feingranular splitten (Regel: nie ganze Slice-Objekte lesen).
  Betroffen v. a. dashboardStore, widgetInstancesStore, discoveryStore,
  connectionStore, notificationsStore, searchStore, timelineStore.
- Lange Listen virtualisieren (falls Länge >200): Timeline, Inbox, DevLog,
  Suchergebnisse, Users, Devices. Nutzt `@tanstack/react-virtual` (bereits kompatibel;
  falls nicht vorhanden, additiv installieren — keine Architekturänderung).
- Route-Level Lazy Splitting: Diagnose-/Developer-/Log-Routen als `.lazy.tsx`,
  damit Prod-Bundle klein bleibt.
- Keine Business-Logik-Änderungen.

## 2. Memory-Hygiene

Systematischer Sweep aller Services/Hooks:
- Event-Listener (window/document/visibilitychange/online/offline): sicherstellen,
  dass Registrierung im `start()` und Freigabe in `stop()` erfolgt.
- Timer/Intervals (Heartbeat, BackgroundSync, discovery poll, updateManager):
  `clearInterval`/`clearTimeout` in `stop()`.
- Store-Subscriptions (`zustand.subscribe`) — bootstrap sammelt bereits
  `unsubscribers[]`; gleiches Muster auf `intelligence`, `search`, `notifications`,
  `groups`, `automations`, `timeline` prüfen und ergänzen.
- WebSocketManager: doppelte Handler-Registrierung ausschließen (idempotent).
- MutationObserver/ResizeObserver in Runtime-Komponenten cleanup in useEffect.

## 3. Zentrales Error Boundary System

Aufbauend auf `errorBus` + bestehendem `reportLovableError`:

- Neue Komponente `src/components/errors/AppErrorBoundary.tsx` (React ErrorBoundary),
  meldet an `errorBus` + `reportLovableError`, mit „Neu laden“ / „Zurück“ / „Diagnose öffnen“.
- `RouteErrorBoundary` als leichter Wrapper für pro-Route-Einsatz.
- Globaler Handler in `src/services/errors/globalHandlers.ts`:
  `window.onerror`, `unhandledrejection` → `errorBus.report(...)`.
- Registrierung in `bootstrap.ts` (nur Client).
- `__root.tsx` erhält `errorComponent` / `notFoundComponent` über bestehende
  TanStack-Konventionen (nur wenn noch nicht gesetzt).

Keine parallele Fehlerarchitektur — alles fließt in `errorBus`.

## 4. Recovery Layer

Neu: `src/services/recovery/RecoveryManager.ts` (koordiniert bestehende Systeme):
- Beobachtet `errorBus`, `connectionStore`, `offlineStore`, `updateStore`.
- Triggert bekannte Aktionen:
  - WebSocket: `wsManager.connect()` mit Backoff (bereits vorhanden).
  - CommandQueue: `backgroundSync.flush()` (bereits vorhanden).
  - Cache: `cacheManager.invalidate(bucket)` bei Cache-Fehler.
  - Store-Recovery: `dashboardManager.hydrate()`, `roomManager.hydrate()`,
    `versionManager.hydrate()` re-run bei Hydration-Error.
- Kein neuer Persistenzpfad, keine neue Business-Logik.
- Start/Stop in `bootstrap.ts`.

## 5. Logging-Erweiterung

`src/services/logger/Logger.ts` erweitern (additiv, API-kompatibel):
- Level `critical` ergänzen.
- Interner Ringpuffer (z. B. 2000 Einträge) für Filter/Export.
- Neuer Store `src/store/slices/logStore.ts` (nur UI-Spiegel, bounded).
- Export als JSON/Text (Download); Filter nach Scope + Level.
- `PerformanceLogger`-Helper (Wrap um `performance.mark/measure`) für einzelne
  Bootstrap-/Hydration-Phasen; loggt in denselben Logger — keine parallele API.

## 6. Diagnostics-Seite

Route `/_app/settings/diagnostics.tsx`, liest ausschließlich aus bestehenden Systemen:
- Version: `versionManager` (app/dataModel/cache/backup/schema).
- Build-Info: kompilierte Konstanten aus `src/generated/buildInfo.ts` (siehe §13).
- WebSocket: `connectionStore` (Status, Latenz, Reconnects, Auth).
- Discovery: `discoveryStore` (Geräteanzahl, letzte Snapshots, Errors).
- Cache: `cacheManager.stats()` (bestehend/ergänzen um read-only stats).
- Offline: `offlineStore`.
- Service Worker: `updateManager.getState()` + registration info.
- Speicher: `navigator.storage.estimate()` (Client-Only, in Effect).
- Registrierungszähler: `widgetRegistryStore`, `capabilityRegistry`,
  `deviceCatalogStore`, `automationsStore`, `timelineSourceRegistry`,
  `searchProviderRegistry`, `notificationProducerRegistry`,
  `backupProviderRegistry`, `commandRegistry`.
- Export als JSON.

## 7. Health-Check Manager

`src/services/health/HealthManager.ts` mit generischer Provider-Registry
`HealthCheckRegistry`:
- Interface `HealthCheck { id; label; run(): Promise<{status:"ok"|"warn"|"fail", detail?}> }`.
- Built-in Checks (thin adapter, keine Reparatur):
  stores-hydrated, ws-connected, discovery-ready, cache-init, backup-providers,
  service-worker, migrations-applied, registry-nonEmpty (widgets/capabilities/…).
- Nur Diagnose; Ergebnis in `healthStore`.
- Widget `system.healthStatus` + Anzeige in Diagnostics.
- Erweiterbar wie alle anderen Registries.

## 8. Security-Vorbereitung

- `src/services/security/csp.ts` — dokumentierte CSP/Security-Header-Vorlage
  (Kommentare, Konstanten) für Reverse-Proxy-Konfiguration. Kein Code, der
  Header setzt (kein Serverpfad in dieser Runtime nötig).
- ENV-Handling: `src/config/env.ts` typisiert `import.meta.env.VITE_*` und
  liefert klare Defaults. Prüfen: keine Secrets im Bundle.
- Secret-Handling-Doku in `docs/SECURITY.md`.

## 9. Accessibility-Audit

Systematischer Sweep, ohne Redesign:
- Icon-only Buttons → `aria-label` (BottomNav, IconButton-Varianten,
  Palette-Aktionen, SceneCard-Ausführen, GroupCard-Toggle, RoomCard-Menu).
- `<main>` genau einmal (in `_app.tsx`), `<h1>` pro Route via `PageHeader`.
- Fokus-Ringe an interaktiven Glass-Komponenten sichtbar (`focus-visible`).
- Kontraste über Tokens (kein `text-gray-*` in Komponenten).
- Touchflächen ≥44px an Bottom-Nav & Palette.
- Live-Regionen für Toasts (`aria-live="polite"`) — falls fehlt.

## 10. Testing-Vorbereitung (leichtgewichtig)

- `src/services/selfCheck/StartupValidation.ts`: Läuft nach `bootstrap`,
  prüft Registries auf non-empty, Router-Tree konsistent, Store-Hydration ok.
  Ergebnis → `logStore` + optional Toast bei `fail`.
- Kein Jest/Vitest neu installieren. Vorhandene Setup-Skripte unverändert.

## 11. Developer Tools Seite

Route `/_app/settings/developer` (bereits vorhanden) erweitern um Tabs:
- Stores: Snapshot aller registrierten Slices (read-only JSON-Tree).
- Registries: Live-Liste (Widget/Capability/Device/Timeline/Search/Backup/…).
- Cache: Buckets + Größen.
- Versionen: Modell-/Migrationstabelle.
- Build-Info.
Nur sichtbar bei `settingsStore.developerMode === true`.

## 12. Feature Flags

`src/services/flags/FeatureFlags.ts` + `flagsStore`:
- API: `flags.get(key, default)`, `flags.set(key, value)`, `flags.list()`.
- Persistenz lokal (kein Remote, keine Cloud).
- Beispiel-Flags: `ui.virtualization`, `dev.showDiagnosticsWidget`.
- UI unter `/settings/developer` (Flags-Tab).

## 13. Build-Info & Environments

- Vite `define` (in `vite.config.ts`) füllt `__BUILD_HASH__`, `__BUILD_TIME__`,
  `__BUILD_MODE__` → generierte Datei `src/generated/buildInfo.ts`.
- `env.ts` normalisiert `MODE` in dev/staging/prod.
- Kein Wechsel des Builders.

## 14. Neue Routen

- `/settings/diagnostics` — Diagnose + Health + Export
- `/settings/performance` — Perf-Marker, Bundle-Hints, Virtualisierungs-Flags
- `/settings/logs` — Log-Viewer, Filter, Export
- `/settings/developer` — erweitert (Tabs)

Alle als `.lazy.tsx` (Code-Splitting). Verlinkt in `_app.settings.index.tsx`.

## 15. Neue Widgets (via WidgetRegistry)

- `system.healthStatus`
- `system.performance` (FPS, Render-Zeiten Sampler)
- `system.diagnostics` (Kurzstatus)
- `system.buildInfo`

Registrierung ausschließlich in `src/services/widgets/builtin/system.tsx` +
Eintrag in `builtin/index.ts`.

## 16. Dokumentation

Automatisch generierte, gepflegte Markdown-Dateien unter `docs/`:
- `docs/ARCHITECTURE.md` — Layer-Übersicht (Kommunikation → Registry → Manager → Store → UI).
- `docs/MODULES.md` — Alle Services + Verantwortlichkeiten.
- `docs/REGISTRIES.md` — Vollständige Registry-Liste + Erweiterungs-API.
- `docs/STORES.md` — Slice-Übersicht, Persistenzpfad, Reset.
- `docs/ROUTING.md` — Routen-Baum + Zweck.
- `docs/VERSIONS.md` — Schema-/Migrations-Tabelle.
- `docs/SECURITY.md` — CSP/Header/Env/Secrets-Empfehlungen.
- `docs/DEPLOYMENT.md` — Proxmox/HTTPS/Reverse-Proxy/appsocket.

Statisch gepflegt (keine Runtime-Generierung nötig).

## 17. Bootstrap-Integration

`src/services/bootstrap.ts` erweitert (rein additiv, gleiche Reihenfolge-Regeln):
1. Global error handlers registrieren (früh).
2. Logger-Ringpuffer aktivieren.
3. `recoveryManager.start()`.
4. `healthManager.start()`.
5. `startupValidation.run()` (nach allen `bootstrap*()`-Calls).
Alles mit korrespondierendem Stop im Teardown.

## 18. Nicht enthalten

Keine neuen Smart-Home-Funktionen, keine Cloud, kein Push, keine KI,
keine neue Discovery, keine neuen Geräte, keine Server-Runtime-Logik,
keine Änderungen an bestehenden Managern außer additiven Hooks
(z. B. optionale `stats()`-Methode am CacheManager).

---

### Technische Randnotizen

- Alle neuen Services folgen dem Muster `start()`/`stop()` + `unsubscribers[]`.
- Alle neuen Registries: `register(descriptor)` / `unregister(id)` / `list()`.
- Alle neuen Stores nutzen `_persistStorage.ts` (bounded, JSON, versioniert).
- Keine Datei unter `src/routeTree.gen.ts` manuell ändern.
- Neue Widgets erhalten IDs unter Namespace `system.*`.
- Lazy-Routen: `.lazy.tsx` + `getRouteApi`, keine Komponenten-Exports.
