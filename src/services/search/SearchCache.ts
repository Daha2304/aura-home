import type { SearchResult } from "@/models/search";

interface Entry {
  key: string;
  value: SearchResult[];
  at: number;
}

/**
 * Simple LRU cache keyed by normalized query. TTL is short (results
 * reflect live-Store snapshots) but shields against typing spikes.
 */
export class SearchCache {
  private readonly max: number;
  private readonly ttl: number;
  private readonly store = new Map<string, Entry>();

  constructor(max = 32, ttlMs = 15_000) {
    this.max = max;
    this.ttl = ttlMs;
  }

  private normalize(query: string, extra?: string): string {
    return `${query.trim().toLowerCase()}\x1f${extra ?? ""}`;
  }

  get(query: string, extra?: string): SearchResult[] | undefined {
    const key = this.normalize(query, extra);
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.at > this.ttl) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU position.
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(query: string, value: SearchResult[], extra?: string): void {
    const key = this.normalize(query, extra);
    this.store.delete(key);
    this.store.set(key, { key, value, at: Date.now() });
    while (this.store.size > this.max) {
      const first = this.store.keys().next().value;
      if (first === undefined) break;
      this.store.delete(first);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export const searchCache = new SearchCache();
