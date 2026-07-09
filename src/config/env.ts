/**
 * Environment configuration — typed access to VITE_* variables.
 * Server secrets never live here; they belong to the Reverse Proxy.
 */

type Mode = "development" | "staging" | "production";

function pickMode(raw: string | undefined): Mode {
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "staging" || raw === "stage") return "staging";
  return "development";
}

export const env = {
  mode: pickMode(import.meta.env.MODE),
  isDev: import.meta.env.DEV === true,
  isProd: import.meta.env.PROD === true,
  appName: (import.meta.env.VITE_APP_NAME as string | undefined) ?? "Smart Home",
  appVersion:
    (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "0.15.0",
  publicUrl: (import.meta.env.VITE_PUBLIC_URL as string | undefined) ?? "/",
} as const;

export type AppMode = Mode;
