import type { SearchResult } from "@/models/search";

/**
 * Generic incremental inverted index. Providers with static-ish datasets
 * feed results via `upsert()`; the SearchManager falls back to the index
 * when a provider has no direct `search()` implementation. O(1) id lookup,
 * O(k) token lookup where k = matching postings.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 0);
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

interface IndexEntry {
  result: SearchResult;
  tokens: Set<string>;
  haystack: string;
}

class SearchIndexImpl {
  private readonly byId = new Map<string, IndexEntry>();
  private readonly byToken = new Map<string, Set<string>>();

  size(): number {
    return this.byId.size;
  }

  clear(): void {
    this.byId.clear();
    this.byToken.clear();
  }

  upsert(result: SearchResult): void {
    this.remove(result.id);
    const haystack = normalize(
      [result.title, result.subtitle ?? "", result.description ?? ""].join(" "),
    );
    const tokens = new Set(
      tokenize(
        `${result.title} ${result.subtitle ?? ""} ${result.description ?? ""}`,
      ),
    );
    this.byId.set(result.id, { result, tokens, haystack });
    for (const t of tokens) {
      let set = this.byToken.get(t);
      if (!set) {
        set = new Set();
        this.byToken.set(t, set);
      }
      set.add(result.id);
    }
  }

  remove(id: string): void {
    const entry = this.byId.get(id);
    if (!entry) return;
    for (const t of entry.tokens) {
      const set = this.byToken.get(t);
      if (!set) continue;
      set.delete(id);
      if (set.size === 0) this.byToken.delete(t);
    }
    this.byId.delete(id);
  }

  bulkReplace(providerId: string, results: SearchResult[]): void {
    // Remove existing entries from this provider then re-insert.
    const stale: string[] = [];
    for (const [id, entry] of this.byId) {
      if (entry.result.providerId === providerId) stale.push(id);
    }
    for (const id of stale) this.remove(id);
    for (const r of results) this.upsert(r);
  }

  getById(id: string): SearchResult | undefined {
    return this.byId.get(id)?.result;
  }

  search(query: string, limit = 100): SearchResult[] {
    const q = query.trim();
    if (!q) return [];
    const qTokens = tokenize(q);
    const qNorm = normalize(q);

    // Union of postings for each token; then rank via haystack contains + prefix.
    const candidates = new Map<string, number>();
    for (const token of qTokens) {
      // Prefix scan across index (bounded to keep O(matching) small).
      for (const [key, ids] of this.byToken) {
        if (!key.startsWith(token)) continue;
        const exact = key === token ? 1 : 0.6;
        for (const id of ids) {
          candidates.set(id, (candidates.get(id) ?? 0) + exact);
        }
      }
    }

    const scored: Array<{ id: string; score: number }> = [];
    for (const [id, score] of candidates) {
      const entry = this.byId.get(id);
      if (!entry) continue;
      let bonus = 0;
      if (entry.haystack.includes(qNorm)) bonus += 0.5;
      if (entry.haystack.startsWith(qNorm)) bonus += 0.3;
      scored.push({ id, score: score / Math.max(1, qTokens.length) + bonus });
    }
    scored.sort((a, b) => b.score - a.score);
    const out: SearchResult[] = [];
    for (const s of scored) {
      const e = this.byId.get(s.id);
      if (e) {
        out.push({ ...e.result, relevance: Math.min(1, s.score) });
        if (out.length >= limit) break;
      }
    }
    return out;
  }
}

export const searchIndex = new SearchIndexImpl();
