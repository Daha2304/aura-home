/**
 * Exponential backoff reconnect strategy contract.
 * Implementation is deferred until WS is wired up.
 */

export interface ReconnectStrategy {
  nextDelay(): number;
  reset(): void;
}

export function createExponentialBackoff(
  base = 500,
  max = 15_000,
): ReconnectStrategy {
  let attempt = 0;
  return {
    nextDelay() {
      const delay = Math.min(max, base * 2 ** attempt);
      attempt += 1;
      return delay + Math.random() * 200;
    },
    reset() {
      attempt = 0;
    },
  };
}
