import type { CommandDescriptor } from "@/models/commandPalette";
import type { SearchProviderDescriptor } from "@/models/searchProvider";
import type { SearchResult } from "@/models/search";
import { searchProviderRegistry } from "./SearchProviderRegistry";

/**
 * Commands are first-class palette entries. They register once and appear
 * as SearchResults (type "command") via a dedicated SearchProvider adapter.
 * Neue Commands ausschließlich via commandRegistry.register(...).
 */
class CommandRegistryImpl {
  private readonly commands = new Map<string, CommandDescriptor>();

  register(cmd: CommandDescriptor): () => void {
    this.commands.set(cmd.id, cmd);
    return () => this.unregister(cmd.id);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  list(): CommandDescriptor[] {
    return [...this.commands.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
  }

  get(id: string): CommandDescriptor | undefined {
    return this.commands.get(id);
  }
}

export const commandRegistry = new CommandRegistryImpl();

/** Adapter that exposes registered commands via SearchProviderRegistry. */
export const commandProvider: SearchProviderDescriptor = {
  id: "search.provider.commands",
  label: "Befehle",
  category: "command",
  icon: "terminal",
  priority: 100,
  weight: 1.2,
  search: (ctx) => {
    const q = ctx.query.toLowerCase();
    const cmds = commandRegistry.list();
    const results: SearchResult[] = [];
    for (const cmd of cmds) {
      const hay = [cmd.label, cmd.hint ?? "", ...(cmd.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      if (q && !hay.includes(q)) continue;
      results.push({
        id: `command:${cmd.id}`,
        providerId: "search.provider.commands",
        category: cmd.category,
        type: "command",
        title: cmd.label,
        subtitle: cmd.hint,
        icon: cmd.icon,
        color: cmd.color,
        priority: cmd.priority ?? 5,
        relevance: q ? (hay.startsWith(q) ? 1 : 0.7) : 0.5,
        permission: cmd.permission
          ? { resource: cmd.permission, action: "read" }
          : undefined,
        actions: [
          {
            id: "run",
            label: cmd.label,
            icon: cmd.icon,
            primary: true,
            shortcut: cmd.shortcut,
            run: (c) => cmd.run(c),
          },
        ],
      });
    }
    return results;
  },
};

export function registerCommandProvider(): () => void {
  return searchProviderRegistry.register(commandProvider);
}
