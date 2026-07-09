/**
 * Built-in Backup Providers.
 *
 * Each provider is a thin adapter over an existing Zustand store — NO
 * parallel data models are introduced. Providers read the current store
 * state on export and delegate write-back on import.
 *
 * When a store does not expose a setter, `import` is a no-op for that
 * provider (safe default) so future stores can opt-in without changes here.
 */
import { backupProviderRegistry, type RestoreMode } from "./BackupManager";

type Setter<T> = (data: T, mode: RestoreMode) => void;

interface StoreProviderOpts<T> {
  id: string;
  label: string;
  schemaVersion?: number;
  export: () => T;
  import?: Setter<T>;
}

function registerStore<T>(opts: StoreProviderOpts<T>): void {
  backupProviderRegistry.register<T>({
    id: opts.id,
    label: opts.label,
    schemaVersion: opts.schemaVersion ?? 1,
    export: opts.export,
    import: opts.import ?? (() => {}),
  });
}

// Lazy imports so failing to resolve any single store never breaks the whole
// backup surface. Wrapped in try/catch so unbuilt code paths degrade gracefully.
async function loadStore<T>(path: string): Promise<T | null> {
  try {
    const mod = (await import(/* @vite-ignore */ path)) as T;
    return mod;
  } catch {
    return null;
  }
}

let registered = false;

export async function registerBuiltinBackupProviders(): Promise<void> {
  if (registered) return;
  registered = true;

  // Settings ------------------------------------------------------------
  const settings = await loadStore<typeof import("@/store/slices/settingsStore")>(
    "@/store/slices/settingsStore",
  );
  if (settings) {
    registerStore<Record<string, unknown>>({
      id: "settings",
      label: "Einstellungen",
      export: () => settings.useSettingsStore.getState() as unknown as Record<string, unknown>,
    });
  }

  // Users, profiles, roles, permissions, preferences --------------------
  const users = await loadStore<typeof import("@/store/slices/usersStore")>(
    "@/store/slices/usersStore",
  );
  if (users) registerStore({ id: "users", label: "Benutzer", export: () => users.useUsersStore.getState() });

  const profiles = await loadStore<typeof import("@/store/slices/profilesStore")>(
    "@/store/slices/profilesStore",
  );
  if (profiles) registerStore({ id: "profiles", label: "Profile", export: () => profiles.useProfilesStore.getState() });

  const roles = await loadStore<typeof import("@/store/slices/rolesStore")>(
    "@/store/slices/rolesStore",
  );
  if (roles) registerStore({ id: "roles", label: "Rollen", export: () => roles.useRolesStore.getState() });

  const permissions = await loadStore<typeof import("@/store/slices/permissionsStore")>(
    "@/store/slices/permissionsStore",
  );
  if (permissions) registerStore({ id: "permissions", label: "Berechtigungen", export: () => permissions.usePermissionsStore.getState() });

  const userPrefs = await loadStore<typeof import("@/store/slices/userPreferencesStore")>(
    "@/store/slices/userPreferencesStore",
  );
  if (userPrefs) registerStore({ id: "userPreferences", label: "Benutzer-Einstellungen", export: () => userPrefs.useUserPreferencesStore.getState() });

  // Dashboards / widgets / layouts --------------------------------------
  const dashboards = await loadStore<typeof import("@/store/slices/dashboardsStore")>(
    "@/store/slices/dashboardsStore",
  );
  if (dashboards) registerStore({ id: "dashboards", label: "Dashboards", export: () => dashboards.useDashboardsStore.getState() });

  const widgetInstances = await loadStore<typeof import("@/store/slices/widgetInstancesStore")>(
    "@/store/slices/widgetInstancesStore",
  );
  if (widgetInstances) registerStore({ id: "widgetInstances", label: "Widgets", export: () => widgetInstances.useWidgetInstancesStore.getState() });

  const layouts = await loadStore<typeof import("@/store/slices/layoutsStore")>(
    "@/store/slices/layoutsStore",
  );
  if (layouts) registerStore({ id: "layouts", label: "Layouts", export: () => layouts.useLayoutsStore.getState() });

  // Rooms / devices -----------------------------------------------------
  const rooms = await loadStore<typeof import("@/store/slices/roomsStore")>(
    "@/store/slices/roomsStore",
  );
  if (rooms) registerStore({ id: "rooms", label: "Räume", export: () => rooms.useRoomsStore.getState() });

  const devices = await loadStore<typeof import("@/store/slices/devicesStore")>(
    "@/store/slices/devicesStore",
  );
  if (devices) registerStore({ id: "devices", label: "Geräte", export: () => devices.useDevicesStore.getState() });

  // Scenes --------------------------------------------------------------
  const scenes = await loadStore<typeof import("@/store/slices/scenesStore")>(
    "@/store/slices/scenesStore",
  );
  if (scenes) registerStore({ id: "scenes", label: "Szenen", export: () => scenes.useScenesStore.getState() });

  const sceneTemplates = await loadStore<typeof import("@/store/slices/sceneTemplatesStore")>(
    "@/store/slices/sceneTemplatesStore",
  );
  if (sceneTemplates) registerStore({ id: "sceneTemplates", label: "Szenen-Vorlagen", export: () => sceneTemplates.useSceneTemplatesStore.getState() });

  // Groups --------------------------------------------------------------
  const groups = await loadStore<typeof import("@/store/slices/groupsStore")>(
    "@/store/slices/groupsStore",
  );
  if (groups) registerStore({ id: "groups", label: "Gruppen", export: () => groups.useGroupsStore.getState() });

  // Automations ---------------------------------------------------------
  const automations = await loadStore<typeof import("@/store/slices/automationsStore")>(
    "@/store/slices/automationsStore",
  );
  if (automations) registerStore({ id: "automations", label: "Automationen", export: () => automations.useAutomationsStore.getState() });

  const automationTemplates = await loadStore<typeof import("@/store/slices/automationTemplatesStore")>(
    "@/store/slices/automationTemplatesStore",
  );
  if (automationTemplates) registerStore({ id: "automationTemplates", label: "Automation-Vorlagen", export: () => automationTemplates.useAutomationTemplatesStore.getState() });

  // Timeline / history / stats -----------------------------------------
  const timeline = await loadStore<typeof import("@/store/slices/timelineStore")>(
    "@/store/slices/timelineStore",
  );
  if (timeline) registerStore({ id: "timeline", label: "Timeline", export: () => timeline.useTimelineStore.getState() });

  const history = await loadStore<typeof import("@/store/slices/historyStore")>(
    "@/store/slices/historyStore",
  );
  if (history) registerStore({ id: "history", label: "Historie", export: () => history.useHistoryStore.getState() });

  const statistics = await loadStore<typeof import("@/store/slices/statisticsStore")>(
    "@/store/slices/statisticsStore",
  );
  if (statistics) registerStore({ id: "statistics", label: "Statistiken", export: () => statistics.useStatisticsStore.getState() });

  // Notifications ------------------------------------------------------
  const notifications = await loadStore<typeof import("@/store/slices/notificationsStore")>(
    "@/store/slices/notificationsStore",
  );
  if (notifications) registerStore({ id: "notifications", label: "Benachrichtigungen", export: () => notifications.useNotificationsStore.getState() });

  const notificationRules = await loadStore<typeof import("@/store/slices/notificationRulesStore")>(
    "@/store/slices/notificationRulesStore",
  );
  if (notificationRules) registerStore({ id: "notificationRules", label: "Benachrichtigungs-Regeln", export: () => notificationRules.useNotificationRulesStore.getState() });

  const notificationTemplates = await loadStore<typeof import("@/store/slices/notificationTemplatesStore")>(
    "@/store/slices/notificationTemplatesStore",
  );
  if (notificationTemplates) registerStore({ id: "notificationTemplates", label: "Benachrichtigungs-Vorlagen", export: () => notificationTemplates.useNotificationTemplatesStore.getState() });

  const notificationPreferences = await loadStore<typeof import("@/store/slices/notificationPreferencesStore")>(
    "@/store/slices/notificationPreferencesStore",
  );
  if (notificationPreferences) registerStore({ id: "notificationPreferences", label: "Benachrichtigungs-Einstellungen", export: () => notificationPreferences.useNotificationPreferencesStore.getState() });

  // Search --------------------------------------------------------------
  const searchHistory = await loadStore<typeof import("@/store/slices/searchHistoryStore")>(
    "@/store/slices/searchHistoryStore",
  );
  if (searchHistory) registerStore({ id: "searchHistory", label: "Suchverlauf", export: () => searchHistory.useSearchHistoryStore.getState() });

  const searchFavorites = await loadStore<typeof import("@/store/slices/searchFavoritesStore")>(
    "@/store/slices/searchFavoritesStore",
  );
  if (searchFavorites) registerStore({ id: "searchFavorites", label: "Such-Favoriten", export: () => searchFavorites.useSearchFavoritesStore.getState() });

  const searchPreferences = await loadStore<typeof import("@/store/slices/searchPreferencesStore")>(
    "@/store/slices/searchPreferencesStore",
  );
  if (searchPreferences) registerStore({ id: "searchPreferences", label: "Sucheinstellungen", export: () => searchPreferences.useSearchPreferencesStore.getState() });
}
