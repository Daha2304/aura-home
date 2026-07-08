/**
 * Extrem schlanker keyed Memo-Cache. Wird von Aggregatoren genutzt,
 * um bei unveränderter (devicesRevision, roomId) das vorige Ergebnis
 * wiederzuverwenden.
 */
export class MemoCache<K, V> {
  private readonly entries = new Map<K, V>();

  get(key: K): V | undefined {
    return this.entries.get(key);
  }

  set(key: K, value: V): void {
    this.entries.set(key, value);
  }

  has(key: K): boolean {
    return this.entries.has(key);
  }

  delete(key: K): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
