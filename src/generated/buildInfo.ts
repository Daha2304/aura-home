/**
 * Build-Info — statisch. Kann später von einem Vite-define-Hook
 * überschrieben werden (siehe docs/DEPLOYMENT.md).
 */
import { env } from "@/config/env";

declare const __BUILD_HASH__: string | undefined;
declare const __BUILD_TIME__: string | undefined;
declare const __BUILD_MODE__: string | undefined;

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

export const buildInfo = {
  version: env.appVersion,
  hash: safe(() => (typeof __BUILD_HASH__ === "string" ? __BUILD_HASH__ : "dev"), "dev"),
  time: safe(
    () => (typeof __BUILD_TIME__ === "string" ? __BUILD_TIME__ : new Date().toISOString()),
    new Date().toISOString(),
  ),
  mode: safe(
    () => (typeof __BUILD_MODE__ === "string" ? __BUILD_MODE__ : env.mode),
    env.mode,
  ),
} as const;

export type BuildInfo = typeof buildInfo;
