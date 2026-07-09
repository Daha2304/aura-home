## Teil 14 — PWA, Offline, Backup, Updates & Deployment-Grundlagen

Ziel: Die App vollständig als PWA vorbereiten (installierbar, offlinefähig, updatefähig), ein zentrales Backup/Restore-System, Version- & Migration-Manager sowie Deep-Link- und Lifecycle-Grundlagen — ausschließlich auf Basis der bestehenden Registries, Manager und Stores. Keine parallelen Datenmodelle, keine Cloud, keine nativen Plugins.

---

### 1. Web App Manifest & Icons

- `public/manifest.webmanifest` erweitern:
  - name/short_name, description, `id`, `scope`, `start_url`
  - `display: "standalone"`, `orientation: "portrait"`
  - `theme_color`, `background_color`
  - Icons 192/512 + **maskable** Varianten
  - `shortcuts` (Dashboard, Räume, Szenen, Suche)
  - `screenshots` (Slots vorbereitet, Platzhalter-Assets)
- Head-Tags in `src/routes/__root.tsx`: `apple-touch-icon`, `theme-color` (light/dark), zusätzliche `link rel="icon"`, `mask-icon`.
- Icons als PNGs unter `public/icons/` (via imagegen, App-Marke neutral, quadratisch, maskable-Safe-Area).

### 2. Service Worker (Kill-Switch-sicher, Preview-safe)

- Neue Datei `public/sw.js` — generischer, versionierter SW:
  - App-Shell Precache (Route-HTML, JS/CSS-Manifest-Einträge werden zur Build-Zeit **nicht** injected; SW nutzt Runtime-Strategien).
  - Runtime-Caches (getrennte Buckets, Namen inkl. `SW_VERSION`):
    - `app-shell-v{n}` — HTML: **NetworkFirst** mit Offline-Fallback `/offline.html`.
    - `assets-v{n}` — same-origin gehashte JS/CSS: **CacheFirst**.
    - `images-v{n}` — Bilder: **StaleWhileRevalidate**, LRU-Cap.
    - `fonts-v{n}` — Fonts: **CacheFirst**, langlebig.
  - `activate`: alte Cache-Buckets, deren Version ≠ aktuell, werden gelöscht.
  - `message`-Handler: `SKIP_WAITING`, `CLEAR_CACHES`, `GET_VERSION`.
  - **Keine** Business-Logik, kein Fetch-Rewrite von WebSocket/API-Aufrufen.
- Registrierungs-Wrapper `src/services/pwa/registerServiceWorker.ts`:
  - Registrierung **nur** in `import.meta.env.PROD` **und** außerhalb von Lovable-Preview (`id-preview--*`, `preview--*`, `*.lovableproject.com`, `*.lovableproject-dev.com`, `*.beta.lovable.dev`), nicht im iFrame, nicht bei `?sw=off`.
  - In allen anderen Kontexten: bestehende Registrierungen für `/sw.js` deaktivieren.
- `public/offline.html`: minimale statische Offline-Seite (Design-System-neutral, inline CSS).

### 3. Offline Engine

`src/services/offline/`:
- `OfflineEngine.ts` — abonniert `online`/`offline`, `document.visibilitychange`, verwaltet `isOnline`-Zustand als Store-Selector.
- `offlineStore.ts` (Zustand-Slice) — `online`, `lastOnlineAt`, `lastOfflineAt`, `pendingCount` (aus Command Queue gelesen, nicht dupliziert).
- Bestehende `CommandQueue` **bleibt unverändert**. Engine liest nur ihren Status und triggert bei Reconnect `commandQueue.flush()` sowie `discoveryEngine.rescan()` (falls vorhanden — sonst dokumentierter Extension-Point).
- Konflikterkennung & Retry: **Interfaces** und Descriptor-Typen (`ConflictResolutionDescriptor`) vorbereitet, keine Business-Logik.

### 4. Background Sync (Vorbereitung)

- `src/services/offline/BackgroundSync.ts`:
  - Registriert bei `visibilitychange → visible` und `online`-Event: Queue-Flush + Discovery-Rescan-Signal.
  - Wenn `SyncManager` (`'sync' in registration`) verfügbar: `sync`-Tag `smarthome-queue-flush` registrieren. Der SW leitet das Event lediglich an den App-Thread weiter (via `postMessage`), damit die Business-Logik nicht in den SW wandert.
  - Delta-Sync als Interface vorbereitet (`DeltaSyncDescriptor`), keine Implementierung.

### 5. Cache Manager

`src/services/cache/CacheManager.ts`:
- Zentrale Facade über die SW-Cache-API + LRU-Bucket-Meta im `localStorage`.
- Buckets: `assets`, `api`, `images`, `widgets`, `search`.
- Integriert bestehende `SearchCache` (Adapter, keine Duplikation): `CacheManager.getBucket('search')` liefert einen dünnen Wrapper um den bestehenden Cache.
- API: `invalidate(bucket?)`, `clearAll()`, `size(bucket)`, `usageBytes()`.
- Ereignisse über bestehenden `errorBus`/`devLog` — kein neues Event-System.

### 6. Backup / Restore

Erweiterung der bereits existierenden `src/services/storage/backup.ts` zu einem echten Backup-System (nicht-brechend):

- Neue Datei `src/services/backup/BackupManager.ts` mit **Provider-Registry** `BackupProviderRegistry`.
- Jeder Domain-Bereich registriert einen Provider (Descriptor: `id`, `label`, `version`, `export()`, `import(payload, mode)`, `migrate(from, to, payload)`):
  - settings, users, profiles, roles, permissions, userPreferences
  - dashboards, widgetInstances, layouts, runtime
  - rooms, devices, deviceCatalog, capabilities
  - scenes, sceneTemplates, sceneVersions
  - groups
  - automations, automationTemplates, automationVariables, automationVersions
  - timeline, history, statistics, insights
  - notifications, notificationRules, notificationTemplates, notificationPreferences
  - search (history, favorites, preferences)
- Bestehender `exportBackup()` bleibt als Legacy-Aufruf funktional; intern delegiert er ans neue System.
- `BackupSchema`: `{ schemaVersion, appVersion, dataModelVersion, createdAt, sections: Record<providerId, { version, data }> }`.
- Restore-Modi: `replace`, `merge`, `selective` (Whitelist von Provider-IDs).
- JSON Import/Export, Datei-Download via bestehende `downloadBackupFile`.

### 7. Version / Migration Manager

`src/services/version/`:
- `VersionManager.ts` — hält & persistiert:
  - `appVersion` (aus `import.meta.env.VITE_APP_VERSION`, Default per Build).
  - `dataModelVersion`, `cacheVersion`, `backupVersion`, `schemaVersions` pro Provider.
- `MigrationManager.ts` — generisch:
  - Registry `MigrationRegistry.register({ providerId, from, to, migrate })`.
  - Beim App-Start und beim Restore werden Migrationsketten sequentiell angewendet.
  - Keine konkreten Migrationen — nur die Architektur + no-op Baseline v1→v1.

### 8. Update Manager

`src/services/pwa/UpdateManager.ts`:
- Beobachtet SW-`updatefound`/`waiting` → schreibt in neuen `updateStore` (`available`, `applying`, `lastChecked`).
- API: `softReload()` (`navigation.reload({ documentTree: true })` bzw. `window.location.reload()`), `hardReload()` (SW `SKIP_WAITING` + Caches leeren + Reload).
- Changelog-Datenstruktur vorbereitet (`ChangelogEntry[]`), Feed leer.

### 9. Deep Links

`src/services/deeplinks/DeepLinkRouter.ts`:
- Parst `smarthome://<kind>/<id>` (device, room, scene, group, automation, dashboard) und mappt auf TanStack-Router-Ziele.
- Registriert Handler für `navigator.registerProtocolHandler` (nur Prod + non-preview).
- Manifest: `protocol_handlers` Entry für `web+smarthome`.
- Kein natives Binding.

### 10. App Lifecycle

`src/services/lifecycle/AppLifecycle.ts`:
- Emittiert über bestehenden `EventEmitter` bzw. `errorBus`-Nachbarsystem (kein neues Bus-System) die Events:
  - `app.start`, `app.resume`, `app.pause`, `app.visible`, `app.hidden`, `app.online`, `app.offline`.
- Bindet an `visibilitychange`, `pageshow`, `pagehide`, `online`, `offline`.
- Wird von OfflineEngine, BackgroundSync und UpdateManager konsumiert.

### 11. Capacitor-Vorbereitung (nur Struktur)

- `capacitor.config.ts` (nur Konfig-Skelett, `appId`, `appName`, `webDir`) — **nicht** an Build angebunden.
- README-Notiz zu geplanten Ordnern `android/`, `ios/` — leer belassen.
- Keine Plugins, keine Native-APIs.

### 12. Widgets (via WidgetRegistry)

Neue Built-in Widgets unter `src/services/widgets/builtin/system.tsx` (registriert in `src/services/widgets/builtin/index.ts`):
- `system.backupStatus`
- `system.offlineStatus`
- `system.syncStatus`
- `system.updateStatus`
- `system.storageStatus`

Lesen ausschließlich aus den neuen Stores; kein zusätzlicher State.

### 13. Settings & Routen

Neue Routen (jeweils `createFileRoute("/_app/settings/...")`):
- `_app.settings.offline.tsx`
- `_app.settings.backup.tsx` — **erweitert** die bestehende Datei (Export/Import mit Provider-Auswahl, Merge/Replace).
- `_app.settings.restore.tsx`
- `_app.settings.update.tsx`
- `_app.settings.storage.tsx`
- `_app.settings.app.tsx` (App-Info, Versionen, Build-Hash)

Bestehende Backup-Route bleibt funktional; wird nur inhaltlich ausgebaut.
Verlinkung im bestehenden Settings-Hub (`_app.settings.index.tsx`) ergänzen.

### 14. Bootstrap-Integration

`src/services/bootstrap.ts` erweitert (nur zusätzliche Aufrufe, keine Umstrukturierung):
- `registerServiceWorker()` (guarded).
- `versionManager.hydrate()`, `migrationManager.runPending()`.
- `backupProviderRegistry` mit Built-in Providern initialisieren.
- `cacheManager.init()`, `offlineEngine.start()`, `backgroundSync.start()`, `updateManager.start()`, `appLifecycle.start()`, `deepLinkRouter.start()`.
- Stop-Pfade in `stopCommunicationLayer()`.

### 15. Performance / A11y

- Neue Routen via TanStack Auto-Code-Splitting (kein Route-Export der Komponente).
- Schwere UI-Bereiche (Backup-Restore-Listen) mit `React.memo` + memoisierten Selektoren.
- Große Listen: bestehende Virtualisierung wiederverwenden (falls bereits im Projekt), sonst leichtes Fenstern via CSS `content-visibility`.
- A11y: alle Statusanzeigen mit `aria-live="polite"`, Offline-/Update-Banner mit Rolle `status`, Buttons ≥ 44px.

### 16. Was explizit NICHT gebaut wird

- Keine Cloud, kein Push, keine Google/Apple-Services, keine externe Sync, keine Accounts.
- Keine echten Migrationen (nur Architektur).
- Keine nativen Plugins.
- Keine Perf-/Security-Härtung (Teil 15).

---

### Erweiterbarkeitsgarantie

Neue Backup-Bereiche → `backupProviderRegistry.register(descriptor)`.  
Neue Migrationen → `migrationRegistry.register({...})`.  
Neue Cache-Buckets → `cacheManager.registerBucket(descriptor)`.  
Neue Deep-Link-Ziele → `deepLinkRouter.register(kind, resolver)`.  
Neue Systemwidgets → `widgetRegistry.register(descriptor)`.  

Kein bestehender Manager, keine bestehende Datei muss dafür erneut geändert werden.

---

Soll ich so implementieren?
