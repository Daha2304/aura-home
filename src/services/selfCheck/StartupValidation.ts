/**
 * StartupValidation — leichter Self-Check nach Bootstrap.
 * Nutzt HealthManager + Registries. Meldet ausschließlich, keine Aktion.
 */
import { createLogger } from "@/services/logger/Logger";
import { healthManager } from "@/services/health";
import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { useVersionStore } from "@/services/version/VersionManager";

const log = createLogger("selfcheck");

export interface StartupResult {
  ok: boolean;
  problems: string[];
  ranAt: number;
}

export async function runStartupValidation(): Promise<StartupResult> {
  const problems: string[] = [];

  if (widgetRegistry.all().length === 0) {
    problems.push("Widget-Registry ist leer.");
  }

  const version = useVersionStore.getState();
  if (!version.appVersion) problems.push("App-Version fehlt.");

  try {
    await healthManager.runAll();
  } catch (err) {
    problems.push("HealthManager konnte nicht laufen: " + String(err));
  }

  const result: StartupResult = {
    ok: problems.length === 0,
    problems,
    ranAt: Date.now(),
  };
  if (result.ok) log.info("startup validation ok");
  else log.warn("startup validation problems:", problems);
  return result;
}
