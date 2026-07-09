import type { ID, Timestamp, IconName } from "./common";
import type {
  AutomationAction,
  AutomationCategory,
  AutomationTrigger,
  ConditionNode,
} from "./automation";
import type { SceneParameter } from "./scene";

/**
 * Automation Template — eigene Datenstruktur analog SceneTemplate.
 * Templates werden über den TemplateManager zu regulären Automationen
 * instanziiert; keine Ausführungslogik liegt hier.
 */
export interface AutomationTemplate {
  id: ID;
  uuid: string;
  name: string;
  description?: string;
  icon?: IconName;
  color?: string;
  category?: AutomationCategory;
  tags: string[];
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  parameters?: SceneParameter[];
  triggers: AutomationTrigger[];
  conditions?: ConditionNode;
  actions: AutomationAction[];
  builtin?: boolean;
}
