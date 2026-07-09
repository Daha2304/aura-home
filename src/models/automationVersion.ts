import type { ID, Timestamp } from "./common";
import type { Automation } from "./automation";

export interface AutomationVersion {
  id: ID;
  automationId: ID;
  versionNumber: number;
  createdAt: Timestamp;
  createdBy?: string;
  payload: Omit<Automation, "version">;
}
