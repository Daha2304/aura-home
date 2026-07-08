export interface Dictionary {
  nav: {
    dashboard: string;
    rooms: string;
    devices: string;
    scenes: string;
    automations: string;
    statistics: string;
    settings: string;
    more: string;
  };
  common: {
    add: string;
    edit: string;
    done: string;
    cancel: string;
    save: string;
    delete: string;
    search: string;
    empty: string;
    loading: string;
    offline: string;
    online: string;
  };
  connection: {
    idle: string;
    connecting: string;
    connected: string;
    reconnecting: string;
    disconnected: string;
    error: string;
  };
  empty: {
    rooms: string;
    devices: string;
    scenes: string;
    automations: string;
    connectHint: string;
  };
}

export const de: Dictionary = {
  nav: {
    dashboard: "Dashboard",
    rooms: "Räume",
    devices: "Geräte",
    scenes: "Szenen",
    automations: "Automationen",
    statistics: "Statistik",
    settings: "Einstellungen",
    more: "Mehr",
  },
  common: {
    add: "Hinzufügen",
    edit: "Bearbeiten",
    done: "Fertig",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    search: "Suchen",
    empty: "Nichts vorhanden",
    loading: "Lädt …",
    offline: "Offline",
    online: "Online",
  },
  connection: {
    idle: "Nicht verbunden",
    connecting: "Verbinde …",
    connected: "Verbunden",
    reconnecting: "Neuverbindung …",
    disconnected: "Getrennt",
    error: "Fehler",
  },
  empty: {
    rooms: "Noch keine Räume",
    devices: "Noch keine Geräte",
    scenes: "Noch keine Szenen",
    automations: "Noch keine Automationen",
    connectHint: "Verbinde dich mit einem Server, um Daten zu laden.",
  },
};
