export {
  versionManager,
  useVersionStore,
  APP_VERSION,
  DATA_MODEL_VERSION,
  BACKUP_VERSION,
  CACHE_VERSION,
} from "./VersionManager";
export { migrationManager, migrationRegistry } from "./MigrationManager";
export type { MigrationDescriptor } from "./MigrationManager";
