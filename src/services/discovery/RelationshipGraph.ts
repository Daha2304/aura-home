import type { ID } from "@/models/common";
import type { RelationshipKind } from "@/models/deviceRelationship";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";

interface Edge {
  target: ID;
  kind: RelationshipKind;
}

/**
 * Bidirektionaler Beziehungsgraph zwischen Geräten. Kein Store — reine
 * Datenstruktur mit O(1)-Lookup, die vom {@link DiscoveryEngine} und
 * {@link DeviceSync} gefüllt wird.
 */
export class RelationshipGraph {
  private readonly out = new Map<ID, Set<Edge>>();
  private readonly in = new Map<ID, Set<Edge>>();

  link(a: ID, b: ID, kind: RelationshipKind, meta?: Record<string, unknown>): boolean {
    if (a === b) return false;
    if ((kind === "child" || kind === "parent") && this.wouldCycle(a, b, kind)) {
      errorBus.report(
        new AppError("invalid_message", "Zyklische Parent/Child-Beziehung", {
          code: "relationship_cycle",
          context: { a, b, kind, meta },
        }),
      );
      return false;
    }
    this.ensure(this.out, a).add({ target: b, kind });
    this.ensure(this.in, b).add({ target: a, kind });
    return true;
  }

  unlink(a: ID, b: ID, kind?: RelationshipKind): void {
    this.removeFrom(this.out, a, b, kind);
    this.removeFrom(this.in, b, a, kind);
  }

  unlinkAll(id: ID): void {
    for (const edge of this.out.get(id) ?? []) this.removeFrom(this.in, edge.target, id);
    for (const edge of this.in.get(id) ?? []) this.removeFrom(this.out, edge.target, id);
    this.out.delete(id);
    this.in.delete(id);
  }

  related(id: ID, kind?: RelationshipKind): ID[] {
    const set = this.out.get(id);
    if (!set) return [];
    const out: ID[] = [];
    for (const e of set) if (!kind || e.kind === kind) out.push(e.target);
    return out;
  }

  children(id: ID): ID[] {
    return this.related(id, "child");
  }
  parents(id: ID): ID[] {
    return this.related(id, "parent");
  }
  groupsOf(id: ID): ID[] {
    return this.related(id, "group");
  }

  size(): number {
    return this.out.size;
  }

  clear(): void {
    this.out.clear();
    this.in.clear();
  }

  private ensure(map: Map<ID, Set<Edge>>, id: ID): Set<Edge> {
    let set = map.get(id);
    if (!set) {
      set = new Set();
      map.set(id, set);
    }
    return set;
  }

  private removeFrom(
    map: Map<ID, Set<Edge>>,
    from: ID,
    to: ID,
    kind?: RelationshipKind,
  ): void {
    const set = map.get(from);
    if (!set) return;
    for (const e of Array.from(set)) {
      if (e.target === to && (!kind || e.kind === kind)) set.delete(e);
    }
    if (set.size === 0) map.delete(from);
  }

  private wouldCycle(a: ID, b: ID, kind: RelationshipKind): boolean {
    // "a --child--> b" darf keinen Pfad "b --child--> ... --child--> a" erzeugen.
    const start = kind === "child" ? b : a;
    const target = kind === "child" ? a : b;
    const stack = [start];
    const seen = new Set<ID>();
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur === target) return true;
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const e of this.out.get(cur) ?? []) {
        if (e.kind === kind) stack.push(e.target);
      }
    }
    return false;
  }
}

/** Singleton — die App teilt sich einen Graphen. */
export const relationshipGraph = new RelationshipGraph();
