import type { DeviceGroup } from "@/models/deviceGroup";
import { useGroupsStore } from "@/store/slices/groupsStore";

/**
 * Cycle-safe expansion of a group into its concrete device set.
 * Results are memoised in `groupsStore.expandedById` and invalidated
 * whenever any group mutates (the store clears the cache on write).
 */
class GroupResolverImpl {
  /**
   * Depth-first expansion. Never follows a group twice, so cycles that
   * slipped past validation still terminate cleanly.
   */
  expand(groupId: string): string[] {
    const state = useGroupsStore.getState();
    const cached = state.expandedById[groupId];
    if (cached) return cached;

    const out = new Set<string>();
    const visited = new Set<string>();
    const walk = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const g = state.byId[id];
      if (!g) return;
      for (const d of g.deviceIds) out.add(d);
      for (const child of g.groupIds) walk(child);
    };
    walk(groupId);
    const list = Array.from(out);
    state.setExpanded(groupId, list);
    return list;
  }

  /**
   * Does adding `candidates` as child groups of `groupId` create a cycle?
   * `groupId` itself, or any ancestor of `groupId`, may not appear
   * transitively under any candidate.
   */
  wouldCycle(groupId: string, candidates: string[]): boolean {
    const state = useGroupsStore.getState();
    // Collect ancestors of groupId (groups that transitively contain it).
    const ancestors = this.ancestorsOf(groupId, state.groups);
    ancestors.add(groupId);
    for (const c of candidates) {
      if (ancestors.has(c)) return true;
      const descendants = this.descendantsOf(c, state.groups);
      if (descendants.has(groupId)) return true;
    }
    return false;
  }

  private ancestorsOf(groupId: string, groups: DeviceGroup[]): Set<string> {
    const parents = new Map<string, string[]>();
    for (const g of groups) {
      for (const child of g.groupIds) {
        const list = parents.get(child) ?? [];
        list.push(g.id);
        parents.set(child, list);
      }
    }
    const out = new Set<string>();
    const stack = [groupId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const p of parents.get(id) ?? []) {
        if (!out.has(p)) {
          out.add(p);
          stack.push(p);
        }
      }
    }
    return out;
  }

  private descendantsOf(groupId: string, groups: DeviceGroup[]): Set<string> {
    const byId = new Map(groups.map((g) => [g.id, g]));
    const out = new Set<string>();
    const stack = [groupId];
    while (stack.length) {
      const id = stack.pop()!;
      const g = byId.get(id);
      if (!g) continue;
      for (const child of g.groupIds) {
        if (!out.has(child)) {
          out.add(child);
          stack.push(child);
        }
      }
    }
    return out;
  }
}

export const groupResolver = new GroupResolverImpl();
