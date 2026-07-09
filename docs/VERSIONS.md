# Versionsübersicht

Alle Versionsnummern werden lokal über den `VersionManager` verwaltet.

| Feld | Zweck |
|---|---|
| `appVersion` | Marketing-Version, aus `VITE_APP_VERSION` |
| `dataModelVersion` | Struktur aller Kern-Stores |
| `cacheVersion` | Cache-Bucket-Version |
| `backupVersion` | Backup-Format |
| `schemaVersions[providerId]` | pro Backup-Provider |
| `buildHash` | Optional aus `__BUILD_HASH__` |
| `installedAt` | Erst-Installation |

Migrationen werden über `migrationManager.register(migration)` bereitgestellt
und beim Bootstrap ausgeführt (`runPending()`). Migrationen sind idempotent.
