export interface SubscriptionRegistry {
  add(topic: string): boolean;
  remove(topic: string): boolean;
  has(topic: string): boolean;
  all(): string[];
  clear(): void;
}

export function createSubscriptionRegistry(): SubscriptionRegistry {
  const topics = new Set<string>();
  return {
    add(t) {
      if (topics.has(t)) return false;
      topics.add(t);
      return true;
    },
    remove(t) {
      return topics.delete(t);
    },
    has: (t) => topics.has(t),
    all: () => Array.from(topics),
    clear: () => topics.clear(),
  };
}
