# Registry-Übersicht

Alle Erweiterungspunkte sind Registries. Neue Fähigkeiten kommen ausschließlich
über `register(descriptor)`.

| Registry | Datei | Descriptor |
|---|---|---|
| WidgetRegistry | `src/services/widgets/WidgetRegistry.ts` | `WidgetDescriptor` |
| DeviceTypeRegistry | `src/services/registry` | `DeviceTypeDescriptor` |
| CapabilityRegistry | `src/services/capabilities/CapabilityRegistry.ts` | `CapabilityDescriptor` |
| ControlRegistry | `src/services/controls/ControlRegistry.ts` | `ControlDescriptor` |
| DevicePanelRegistry | `src/services/devicePanels/DevicePanelRegistry.ts` | `DevicePanelDescriptor` |
| DevicePropertyRegistry | `src/services/deviceProperties/DevicePropertyRegistry.ts` | Property-Descriptor |
| RoomTypeRegistry | `src/services/rooms` | Raum-Kategorien |
| TimelineSourceRegistry | `src/services/timeline` | `TimelineSourceDescriptor` |
| NotificationProducerRegistry | `src/services/notifications` | Notification-Producer |
| SearchProviderRegistry | `src/services/search/SearchProviderRegistry.ts` | `SearchProvider` |
| CommandRegistry | `src/services/search/CommandRegistry.ts` | Command-Palette-Einträge |
| BackupProviderRegistry | `src/services/backup/BackupManager.ts` | Backup-Provider |
| MigrationRegistry | `src/services/version/MigrationManager.ts` | Migrationen |
| HealthCheckRegistry | `src/services/health/HealthManager.ts` | `HealthCheck` |
| FeatureFlags | `src/services/flags/FeatureFlags.ts` | `FeatureFlagDescriptor` |

Alle Registries folgen dem gleichen Muster: `register`, `unregister`, `list`,
`get`.
