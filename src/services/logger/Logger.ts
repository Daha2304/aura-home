/**
 * Zentraler Logger. Ersetzt console.* im gesamten Kommunikations-Stack,
 * damit ein Debug-Modus / Level global geschaltet werden kann.
 */

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug" | "trace";

const LEVEL_ORDER: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

export interface Logger {
  readonly scope: string;
  child(scope: string): Logger;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  trace(...args: unknown[]): void;
}

let globalLevel: LogLevel = "info";

export function setGlobalLogLevel(level: LogLevel) {
  globalLevel = level;
}

export function getGlobalLogLevel(): LogLevel {
  return globalLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[globalLevel];
}

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;
  const api: Logger = {
    scope,
    child: (sub) => createLogger(`${scope}:${sub}`),
    setLevel: (l) => setGlobalLogLevel(l),
    getLevel: () => globalLevel,
    error: (...a) => shouldLog("error") && console.error(prefix, ...a),
    warn: (...a) => shouldLog("warn") && console.warn(prefix, ...a),
    info: (...a) => shouldLog("info") && console.info(prefix, ...a),
    debug: (...a) => shouldLog("debug") && console.debug(prefix, ...a),
    trace: (...a) => shouldLog("trace") && console.debug(prefix, ...a),
  };
  return api;
}

export const rootLogger = createLogger("app");
