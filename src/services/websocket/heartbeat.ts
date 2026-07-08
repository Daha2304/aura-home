export interface Heartbeat {
  start(): void;
  stop(): void;
  onPong(): void;
}

export function createHeartbeat(_intervalMs: number, _onTimeout: () => void): Heartbeat {
  // Contract only — implementation is added with the real WS client.
  return {
    start() {},
    stop() {},
    onPong() {},
  };
}
