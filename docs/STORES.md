# Store-Übersicht

Alle Zustands-Slices leben in `src/store/slices/`. Persistente Slices nutzen
`_persistStorage.ts` (JSON, versioniert, bounded).

Beispiele:

- `settingsStore`, `connectionStore`, `discoveryStore`
- `devicesStore`, `deviceCatalogStore`
- `roomsStore`, `roomMetricsStore`, `houseMetricsStore`
- `scenesStore`, `sceneTemplatesStore`, `sceneVersionsStore`, `sceneExecutionsStore`
- `groupsStore`, `groupExecutionsStore`
- `automationsStore`, `automationTemplatesStore`, `automationVersionsStore`,
  `automationExecutionsStore`, `automationVariablesStore`
- `dashboardsStore`, `dashboardStore`, `widgetInstancesStore`,
  `widgetRegistryStore`, `layoutsStore`, `editorStore`, `runtimeStore`
- `timelineStore`, `historyStore`, `chartStore`, `insightsStore`,
  `statisticsStore`
- `notificationsStore`, `notificationRulesStore`,
  `notificationPreferencesStore`, `notificationTemplatesStore`
- `usersStore`, `profilesStore`, `rolesStore`, `permissionsStore`,
  `userPreferencesStore`, `assignmentStore`
- `searchStore`, `searchHistoryStore`, `searchFavoritesStore`,
  `searchPreferencesStore`
- `offlineStore`, `updateStore`
- `logStore` (Teil 15), `flagsStore` (Teil 15)

Regeln:
- Feingranulare Selektoren nutzen — nie das ganze Slice-Objekt lesen.
- Cross-Store-Logik läuft über Manager, nicht über direkte Store-Referenzen.
- Migrationen laufen ausschließlich über `MigrationManager`.
