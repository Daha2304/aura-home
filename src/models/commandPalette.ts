import type { IconName } from "./common";
import type { PermissionResource } from "./permission";
import type { SearchCategory, SearchContext } from "./search";

/**
 * Command descriptor for the CommandRegistry. Commands appear in the
 * palette as first-class results and can be filtered by category.
 */
export interface CommandDescriptor {
  id: string;
  label: string;
  hint?: string;
  category: SearchCategory;
  icon?: IconName;
  color?: string;
  keywords?: string[];
  shortcut?: string;
  priority?: number;
  section?: string;
  permission?: PermissionResource;
  run: (ctx: SearchContext) => void | Promise<void>;
}
