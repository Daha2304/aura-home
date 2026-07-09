import type { ID } from "@/models/common";
import type { UserPreferences } from "@/models/userPreferences";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesStore";
import { profileManager } from "./ProfileManager";
import { useUsersStore } from "@/store/slices/usersStore";

export class UserPreferencesManager {
  get(userId: ID): UserPreferences | undefined {
    return useUserPreferencesStore.getState().get(userId);
  }
  ensure(userId: ID): UserPreferences {
    return useUserPreferencesStore.getState().ensure(userId);
  }
  update(userId: ID, patch: Partial<UserPreferences>): void {
    useUserPreferencesStore.getState().update(userId, patch);
  }
  /**
   * Effective preferences = profile defaults merged with per-user overrides.
   * Overrides always win.
   */
  getEffective(userId: ID): UserPreferences {
    const user = useUsersStore.getState().byId[userId];
    const overrides = this.ensure(userId);
    const profile = user?.profileId
      ? profileManager.get(user.profileId)
      : undefined;
    return {
      ...overrides,
      themeId: overrides.themeId ?? profile?.themeId,
      dashboardId: overrides.dashboardId ?? profile?.defaultDashboardId,
      homeRoute: overrides.homeRoute ?? profile?.homeRoute,
      notificationPreferencesId:
        overrides.notificationPreferencesId ?? profile?.notificationPreferencesId,
    };
  }
}

export const userPreferencesManager = new UserPreferencesManager();
