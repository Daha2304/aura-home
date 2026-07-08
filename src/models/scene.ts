import type { ID, IconName } from "./common";

export interface SceneAction {
  deviceId: ID;
  capabilityId: string;
  value: unknown;
}

export interface Scene {
  id: ID;
  name: string;
  icon: IconName;
  color?: string;
  actions: SceneAction[];
  favorite?: boolean;
  order: number;
}
