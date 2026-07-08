export interface SubscriptionRegistry {
  add(topic: string): void;
  remove(topic: string): void;
  all(): string[];
}

export function createSubscriptionRegistry(): SubscriptionRegistry {
  const topics = new Set<string>();
  return {
    add: (t) => topics.add(t),
    remove: (t) => topics.delete(t),
    all: () => Array.from(topics),
  };
}
