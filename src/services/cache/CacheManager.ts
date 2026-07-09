/**
 * CacheManager — facade over the browser CacheStorage API.
 *
 * Buckets are declarative: register a descriptor and query/purge by id.
 * The `search` bucket adapts to the existing `SearchCache` in
 * `src/services/search/SearchCache.ts` — no parallel data model.
 */
import { createLogger } from "@/services/logger/Logger";
import { searchCache } from "@/services/search";

const log = createLogger("cache");

export interface CacheBucketDescriptor {
  id: string;
  label: string;
  cacheName?: string;   // present when backed by CacheStorage
  version: string;
  clear: () => Promise<void>;
  size: () => Promise<number>;      // entry count
  usageBytes?: () => Promise<number>;
}

const buckets = new Map<string, CacheBucketDescriptor>();

const CACHE_PREFIX = "smarthome";
const SW_VERSION = "v1";

function swCache(name: string): string {
  return `${CACHE_PREFIX}-${name}-${SW_VERSION}`;
}

async function cacheStorageBucket(
  id: string,
  label: string,
  short: string,
): Promise<CacheBucketDescriptor> {
  const cacheName = swCache(short);
  return {
    id,
    label,
    cacheName,
    version: SW_VERSION,
    async clear() {
      if (typeof caches === "undefined") return;
      await caches.delete(cacheName);
    },
    async size() {
      if (typeof caches === "undefined") return 0;
      try {
        const c = await caches.open(cacheName);
        return (await c.keys()).length;
      } catch { return 0; }
    },
  };
}

async function initBuiltins(): Promise<void> {
  buckets.set("assets", await cacheStorageBucket("assets", "App-Ressourcen", "assets"));
  buckets.set("images", await cacheStorageBucket("images", "Bilder", "images"));
  buckets.set("fonts", await cacheStorageBucket("fonts", "Schriften", "fonts"));
  buckets.set("shell", await cacheStorageBucket("shell", "App Shell", "shell"));

  // Search cache adapter (in-memory, no CacheStorage).
  buckets.set("search", {
    id: "search",
    label: "Suche",
    version: SW_VERSION,
    clear: async () => { searchCache.clear?.(); },
    size: async () => 0,
  });

  // Widget cache placeholder — nothing to clear yet; buckets register lazily.
  buckets.set("widgets", {
    id: "widgets",
    label: "Widgets",
    version: SW_VERSION,
    clear: async () => {},
    size: async () => 0,
  });

  // API cache placeholder.
  buckets.set("api", {
    id: "api",
    label: "API",
    version: SW_VERSION,
    clear: async () => {},
    size: async () => 0,
  });
}

let initPromise: Promise<void> | null = null;

export const cacheManager = {
  async init(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = initBuiltins();
    return initPromise;
  },

  registerBucket(descriptor: CacheBucketDescriptor): () => void {
    buckets.set(descriptor.id, descriptor);
    return () => buckets.delete(descriptor.id);
  },

  getBucket(id: string): CacheBucketDescriptor | undefined {
    return buckets.get(id);
  },

  list(): CacheBucketDescriptor[] {
    return Array.from(buckets.values());
  },

  async invalidate(id?: string): Promise<void> {
    if (id) {
      const b = buckets.get(id);
      if (b) await b.clear();
      return;
    }
    for (const b of buckets.values()) await b.clear();
    log.info("all caches invalidated");
  },

  async clearAll(): Promise<void> {
    await this.invalidate();
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      await Promise.allSettled(
        names.filter((n) => n.startsWith(`${CACHE_PREFIX}-`)).map((n) => caches.delete(n)),
      );
    }
  },

  async usageBytes(): Promise<number | null> {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    try {
      const est = await navigator.storage.estimate();
      return est.usage ?? 0;
    } catch { return null; }
  },

  async quotaBytes(): Promise<number | null> {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
    try {
      const est = await navigator.storage.estimate();
      return est.quota ?? null;
    } catch { return null; }
  },
};
