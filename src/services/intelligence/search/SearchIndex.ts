import { expandSynonyms } from "./synonyms";

export type SearchEntityKind =
  | "device"
  | "room"
  | "dashboard"
  | "widget"
  | "scene"
  | "automation"
  | "tag";

export interface SearchEntity {
  id: string;
  kind: SearchEntityKind;
  label: string;
  aliases?: string[];
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface SearchHit {
  entity: SearchEntity;
  score: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9äöüß]+/i)
    .filter((t) => t.length >= 2);
}

/**
 * Simpler invertierter Index über alle indexierbaren Entities.
 * Vorbereitet — noch keine UI-Anbindung.
 */
export class SearchIndex {
  private readonly entities = new Map<string, SearchEntity>();
  private readonly tokens = new Map<string, Set<string>>();

  clear(): void {
    this.entities.clear();
    this.tokens.clear();
  }

  add(entity: SearchEntity): void {
    const key = `${entity.kind}:${entity.id}`;
    this.remove(key);
    this.entities.set(key, entity);

    const parts = [entity.label, ...(entity.aliases ?? []), ...(entity.tags ?? [])].join(" ");
    for (const raw of tokenize(parts)) {
      for (const t of expandSynonyms(raw)) {
        let set = this.tokens.get(t);
        if (!set) {
          set = new Set();
          this.tokens.set(t, set);
        }
        set.add(key);
      }
    }
  }

  remove(key: string): void {
    if (!this.entities.delete(key)) return;
    for (const set of this.tokens.values()) set.delete(key);
  }

  search(query: string, limit = 25): SearchHit[] {
    const tokens = tokenize(query).flatMap(expandSynonyms);
    if (tokens.length === 0) return [];

    const scores = new Map<string, number>();
    for (const t of tokens) {
      const hits = this.tokens.get(t);
      if (!hits) continue;
      for (const key of hits) scores.set(key, (scores.get(key) ?? 0) + 1);
    }
    const out: SearchHit[] = [];
    for (const [key, score] of scores) {
      const entity = this.entities.get(key);
      if (entity) out.push({ entity, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, limit);
  }
}

export const searchIndex = new SearchIndex();
