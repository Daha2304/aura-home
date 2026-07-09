/**
 * Global Search & Command Palette (Teil 13).
 *
 * Public entry point. Bootstrap wires built-in providers and commands into
 * their registries. New search sources register via
 * `searchProviderRegistry.register(descriptor)`; new commands via
 * `commandRegistry.register(descriptor)`.
 */
export { searchProviderRegistry } from "./SearchProviderRegistry";
export type { SearchProviderDescriptor } from "@/models/searchProvider";
export { searchIndex } from "./SearchIndex";
export { searchManager } from "./SearchManager";
export { searchCache } from "./SearchCache";
export { scoreResult } from "./SearchRanking";
export { getSuggestions } from "./SearchSuggestions";
export { commandRegistry, registerCommandProvider } from "./CommandRegistry";
export type { CommandDescriptor } from "@/models/commandPalette";
export {
  exportSearch,
  importSearch,
  SEARCH_SCHEMA_VERSION,
} from "./serialization";
export type { SearchExport, SearchImportStrategy } from "./serialization";
export { BUILTIN_SEARCH_PROVIDERS } from "./builtinProviders";

import { searchProviderRegistry } from "./SearchProviderRegistry";
import { BUILTIN_SEARCH_PROVIDERS } from "./builtinProviders";
import { registerCommandProvider } from "./CommandRegistry";
import { registerBuiltinCommands } from "./builtinCommands";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("search");
let started = false;
let unregisters: Array<() => void> = [];

export function startSearchPlatform(): void {
  if (started) return;
  started = true;
  for (const p of BUILTIN_SEARCH_PROVIDERS) {
    unregisters.push(searchProviderRegistry.register(p));
  }
  unregisters.push(registerCommandProvider());
  registerBuiltinCommands();
  log.info("search platform started");
}

export function stopSearchPlatform(): void {
  if (!started) return;
  for (const u of unregisters) u();
  unregisters = [];
  started = false;
}
