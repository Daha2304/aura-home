/**
 * Reine, testbare Utilities für Hero/Greeting-Widgets.
 * Keine React-, Store- oder DOM-Abhängigkeit.
 */

export function greetingForTime(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 14) return "Hallo";
  if (h < 18) return "Guten Tag";
  if (h < 22) return "Guten Abend";
  return "Gute Nacht";
}

export function welcomeBackMessage(lastSeenAt?: number, now = Date.now()): string {
  if (!lastSeenAt) return "Willkommen";
  const days = Math.floor((now - lastSeenAt) / (24 * 3600 * 1000));
  if (days <= 0) return "Willkommen zurück";
  if (days === 1) return "Schön, dich wiederzusehen";
  return `Willkommen zurück nach ${days} Tagen`;
}

export interface SystemHeroInput {
  connected: boolean;
  discoveryReady: boolean;
  syncing: boolean;
  serverName?: string;
}

export function systemHeroMessage(input: SystemHeroInput): {
  title: string;
  subtitle: string;
  tone: "ok" | "info" | "warn";
} {
  if (!input.connected) {
    return {
      title: "Server offline",
      subtitle: input.serverName ? `${input.serverName} ist nicht erreichbar` : "Verbindung wird aufgebaut",
      tone: "warn",
    };
  }
  if (input.syncing) {
    return { title: "Synchronisierung läuft", subtitle: "Daten werden abgeglichen", tone: "info" };
  }
  if (!input.discoveryReady) {
    return { title: "Discovery läuft", subtitle: "Geräte werden erkannt", tone: "info" };
  }
  return {
    title: "Alle Systeme online",
    subtitle: input.serverName ? `Verbunden mit ${input.serverName}` : "Bereit",
    tone: "ok",
  };
}
