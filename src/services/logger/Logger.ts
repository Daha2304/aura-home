/**
 * Zentraler Logger. Erweitert um:
 * - Level "critical" (härtestes Error-Signal, wird als error geloggt und im Sink markiert)
 * - Pluggable Sinks (Ringpuffer, UI-Store, Custom)
 * Die bestehende API bleibt kompatibel.
 */

export type LogLevel =
  | "silent"
  | "critical"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace";

const LEVEL_ORDER: Record<LogLevel, number> = {
  silent: 0,
  critical: 1,
  error: 2,
  warn: 3,
  info: 4,
  debug: 5,
  trace: 6,
};

export interface LogEntry {
  id: number;
  ts: number;
  scope: string;
  level: Exclude<LogLevel, "silent">;
  message: string;
  args: unknown[];
}

export type LogSink = (entry: LogEntry) => void;

export interface Logger {
  readonly scope: string;
  child(scope: string): Logger;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  critical(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  trace(...args: unknown[]): void;
}

let globalLevel: LogLevel = "info";
const sinks = new Set<LogSink>();
let nextId = 1;

export function setGlobalLogLevel(level: LogLevel) {
  globalLevel = level;
}

export function getGlobalLogLevel(): LogLevel {
  return globalLevel;
}

export function addLogSink(sink: LogSink): () => void {
  sinks.add(sink);
  return () => sinks.delete(sink);
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[globalLevel];
}

function emit(
  scope: string,
  level: Exclude<LogLevel, "silent">,
  args: unknown[],
): void {
  const entry: LogEntry = {
    id: nextId++,
    ts: Date.now(),
    scope,
    level,
    message: args.length > 0 ? String(args[0]) : "",
    args: args.slice(1),
  };
  for (const sink of sinks) {
    try {
      sink(entry);
    } catch {
      /* ignore sink errors */
    }
  }
}

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;
  const write = (
    level: Exclude<LogLevel, "silent">,
    consoleFn: (...a: unknown[]) => void,
    args: unknown[],
  ) => {
    if (!shouldLog(level)) return;
    consoleFn(prefix, ...args);
    emit(scope, level, args);
  };
  const api: Logger = {
    scope,
    child: (sub) => createLogger(`${scope}:${sub}`),
    setLevel: (l) => setGlobalLogLevel(l),
    getLevel: () => globalLevel,
    critical: (...a) => write("critical", console.error, a),
    error: (...a) => write("error", console.error, a),
    warn: (...a) => write("warn", console.warn, a),
    info: (...a) => write("info", console.info, a),
    debug: (...a) => write("debug", console.debug, a),
    trace: (...a) => write("trace", console.debug, a),
  };
  return api;
}

export const rootLogger = createLogger("app");

/**
 * Lightweight ring buffer for offline diagnostics. UI stores subscribe via
 * addLogSink() and mirror bounded slices.
 */
const RING_SIZE = 2000;
const ring: LogEntry[] = [];

addLogSink((entry) => {
  ring.push(entry);
  if (ring.length > RING_SIZE) ring.splice(0, ring.length - RING_SIZE);
});

export function getLogBuffer(): readonly LogEntry[] {
  return ring;
}

export function clearLogBuffer(): void {
  ring.length = 0;
}
