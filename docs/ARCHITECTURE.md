# Architektur-Übersicht

Diese Datei fasst die Schichten der Smart-Home-Plattform zusammen. Sie
beschreibt das Zusammenspiel der Systeme, ohne einzelne Implementierungs-
details zu duplizieren.

```
┌────────────────────────────────────────────────────────────┐
│  UI  · Routen (src/routes) · Widgets · Design System       │
├────────────────────────────────────────────────────────────┤
│  Runtime · DashboardRuntime · RuntimeCanvas · Overlays      │
├────────────────────────────────────────────────────────────┤
│  Registries · Widget · Capability · Device · Timeline ·     │
│              Search · Backup · Notification · Health · Flags│
├────────────────────────────────────────────────────────────┤
│  Manager  · Device · Room · Scene · Group · Automation ·    │
│             User · Dashboard · Update · Recovery · Health   │
├────────────────────────────────────────────────────────────┤
│  Stores (Zustand)  · Persist über _persistStorage           │
├────────────────────────────────────────────────────────────┤
│  Kommunikation · WebSocketManager · DiscoveryEngine ·       │
│                  CommandQueue · Offline/BackgroundSync      │
├────────────────────────────────────────────────────────────┤
│  Basis · Logger · ErrorBus · EventEmitter · CacheManager ·  │
│          VersionManager · Migrations · Lifecycle · DeepLinks│
└────────────────────────────────────────────────────────────┘
```

## Prinzipien

- Keine parallelen Datenmodelle. Erweiterungen laufen ausschließlich über
  bestehende Registries und Manager.
- Alle Services haben `start()`/`stop()` mit sauberer Ressourcen-Freigabe.
- Neue UI kommt über Routen unter `src/routes/` und Widgets über die
  `widgetRegistry`.
- Persistente Daten laufen durch `_persistStorage.ts` (versioniert, JSON).
- Fehler fließen über den `errorBus`, Logs über den `Logger` + `logStore`.
