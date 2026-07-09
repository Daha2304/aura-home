# Modul-Übersicht

Kurzbeschreibung der wichtigsten Service-Module.

| Modul | Datei | Verantwortung |
|---|---|---|
| WebSocketManager | `src/services/websocket/WebSocketManager.ts` | Verbindung, Auth, Heartbeat, Backoff |
| DiscoveryEngine | `src/services/discovery/DiscoveryEngine.ts` | Snapshot & Import von Geräten |
| DeviceManager | `src/services/deviceManager/DeviceManager.ts` | Geräte-Lebenszyklus |
| CommandQueue | `src/services/commands/CommandQueue.ts` | Persistent queued Commands |
| CapabilityRegistry | `src/services/capabilities` | Fähigkeiten, Präsentation |
| DashboardManager | `src/services/dashboards/DashboardManager.ts` | Dashboards, Layouts |
| WidgetRegistry | `src/services/widgets/WidgetRegistry.ts` | Widget-Descriptors |
| RoomManager | `src/services/rooms` | Räume, Kategorien |
| SceneManager | `src/services/scenes` | Szenen |
| GroupManager | `src/services/groups` | Gerätegruppen |
| AutomationEngine | `src/services/automations` | Trigger, Executor |
| Timeline | `src/services/timeline` | Verlauf, Analytics |
| NotificationRegistry | `src/services/notifications` | Event Center |
| SearchManager | `src/services/search` | Suche & Command Palette |
| UserManager | `src/services/users` | Benutzer, Rollen, Rechte |
| CacheManager | `src/services/cache/CacheManager.ts` | Cache-Buckets |
| VersionManager | `src/services/version` | App/Data/Cache/Backup-Versionen |
| MigrationManager | `src/services/version/MigrationManager.ts` | Registry-basierte Migrationen |
| BackupManager | `src/services/backup/BackupManager.ts` | Provider-basiertes Backup |
| OfflineEngine | `src/services/offline/OfflineEngine.ts` | Online/Offline-Zustand |
| BackgroundSync | `src/services/offline/BackgroundSync.ts` | Command-Flush |
| UpdateManager | `src/services/pwa/UpdateManager.ts` | Service-Worker Updates |
| DeepLinkRouter | `src/services/deeplinks` | `smarthome://`-URLs |
| AppLifecycle | `src/services/lifecycle` | visibility/online/offline |
| Logger | `src/services/logger/Logger.ts` | Log-Level + Sinks + Ringpuffer |
| ErrorBus | `src/services/errors/ErrorBus.ts` | Zentraler Fehlerkanal |
| HealthManager | `src/services/health/HealthManager.ts` | Diagnose-Checks (read-only) |
| RecoveryManager | `src/services/recovery/RecoveryManager.ts` | Reconnect / Sync-Trigger |
| StartupValidation | `src/services/selfCheck/StartupValidation.ts` | Self-Check nach Bootstrap |
| FeatureFlags | `src/services/flags/FeatureFlags.ts` | Lokale Flags |
