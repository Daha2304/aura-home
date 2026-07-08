export interface HeartbeatOptions {
  intervalMs: number;
  timeoutMs: number;
  onBeat: () => void;
  onTimeout: () => void;
}

export interface Heartbeat {
  start(): void;
  stop(): void;
  ack(): void;
  latencyMs(): number | undefined;
}

/**
 * Sendet in festem Intervall einen Heartbeat (Ping) via onBeat.
 * Wird innerhalb von timeoutMs kein ack() gerufen, feuert onTimeout.
 */
export function createHeartbeat(opts: HeartbeatOptions): Heartbeat {
  let interval: ReturnType<typeof setInterval> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let sentAt = 0;
  let latency: number | undefined;

  const clearTimeoutTimer = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return {
    start() {
      this.stop();
      interval = setInterval(() => {
        sentAt = Date.now();
        opts.onBeat();
        clearTimeoutTimer();
        timeout = setTimeout(() => opts.onTimeout(), opts.timeoutMs);
      }, opts.intervalMs);
    },
    stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      clearTimeoutTimer();
    },
    ack() {
      if (sentAt > 0) latency = Date.now() - sentAt;
      clearTimeoutTimer();
    },
    latencyMs() {
      return latency;
    },
  };
}
