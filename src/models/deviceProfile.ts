import type { HexColor, IconName, ID, Timestamp } from "./common";

/**
 * Statisches Profil eines Geräts (Metadaten, keine Live-Werte).
 * Ist Teil von {@link ./device.Device} und additiv — alle Felder optional.
 */
export interface DeviceProfile {
  manufacturer?: string;
  model?: string;
  firmware?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  serial?: string;
  uuid?: string;
  mac?: string;
  icon?: IconName;
  image?: string;
  color?: HexColor;
  description?: string;
  tags?: string[];
  floor?: number;
  roomId?: ID;
  installedAt?: Timestamp;
  customProperties?: Record<string, unknown>;
}
