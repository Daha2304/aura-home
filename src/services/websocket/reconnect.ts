export interface ReconnectStrategy {
  nextDelay(): number;
  reset(): void;
  attempts(): number;
}

/**
 * Exponentielles Backoff mit Jitter.
 * base * 2^attempt, gecapped bei max, + Random(0..jitter).
 */
export function createExponentialBackoff(
  base = 500,
  max = 15_000,
  jitter = 300,
): ReconnectStrategy {
  let attempt = 0;
  return {
    nextDelay() {
      const delay = Math.min(max, base * 2 ** attempt);
      attempt += 1;
      return delay + Math.random() * jitter;
    },
    reset() {
      attempt = 0;
    },
    attempts() {
      return attempt;
    },
  };
}
