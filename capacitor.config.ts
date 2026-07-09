/**
 * Capacitor configuration skeleton for future Android / iOS builds.
 *
 * This file is intentionally NOT wired into the current Vite build. Adding
 * `@capacitor/core` + platform folders is deferred to a later part. Keeping
 * the config in tree lets the shell (or a future CLI) pick it up unchanged.
 */
export const capacitorConfig = {
  appId: "app.smarthome.zentrale",
  appName: "Smart Home",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {},
} as const;

export default capacitorConfig;
