import type { ID } from "@/models/common";
import type { Profile } from "@/models/profile";
import { useProfilesStore } from "@/store/slices/profilesStore";
import { profileRegistry } from "./ProfileRegistry";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesStore";
import { useUsersStore } from "@/store/slices/usersStore";

export class ProfileManager {
  list(): Profile[] {
    return [
      ...profileRegistry.list(),
      ...useProfilesStore.getState().profiles.filter((p) => !p.builtin),
    ];
  }
  get(id: ID): Profile | undefined {
    return (
      profileRegistry.get(id) ?? useProfilesStore.getState().byId[id]
    );
  }
  upsert(p: Profile): void {
    useProfilesStore.getState().upsert({ ...p, builtin: false });
  }
  remove(id: ID): void {
    useProfilesStore.getState().remove(id);
  }
  /** Applies profile defaults into a user's preferences. */
  applyProfile(userId: ID, profileId: ID): void {
    const profile = this.get(profileId);
    if (!profile) return;
    useUsersStore.getState().assignProfile(userId, profileId);
    useUserPreferencesStore.getState().update(userId, {
      themeId: profile.themeId,
      dashboardId: profile.defaultDashboardId,
      homeRoute: profile.homeRoute,
      notificationPreferencesId: profile.notificationPreferencesId,
    });
  }
}

export const profileManager = new ProfileManager();
