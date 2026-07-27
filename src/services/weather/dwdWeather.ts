export type WeatherCondition = "sunny" | "cloudy" | "rain" | "snow" | "storm" | "fog";

export interface DwdWeatherSnapshot {
  postalCode: string;
  stationId: string;
  stationName: string;
  fetchedAt: number;
  temperatureC: number | null;
  minC: number | null;
  maxC: number | null;
  precipitationMm: number | null;
  precipitationProbability: number | null;
  humidity: number | null;
  condition: WeatherCondition;
  conditionLabel: string;
}

interface DwdForecast {
  start?: number;
  timeStep?: number;
  temperature?: Array<number | null>;
  precipitationTotal?: Array<number | null>;
  precipitationProbablity?: Array<number | null> | null;
  humidity?: Array<number | null>;
  cloudCoverTotal?: Array<number | null>;
  sunshine?: Array<number | null>;
  icon?: Array<number | null>;
}

interface DwdDay {
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  precipitation?: number | null;
  icon?: number | null;
}

interface DwdStationOverview {
  forecast1?: DwdForecast;
  days?: DwdDay[];
}

const POSTAL_CODE_STATIONS: Record<string, { stationId: string; stationName: string }> = {
  "81243": { stationId: "10865", stationName: "München" },
};

const DWD_ENDPOINTS = [
  "https://dwd.api.proxy.bund.dev/v30/stationOverviewExtended",
  "https://app-prod-ws.warnwetter.de/v30/stationOverviewExtended",
];

export function resolveDwdStation(postalCode: string) {
  const normalized = normalizePostalCode(postalCode);
  return POSTAL_CODE_STATIONS[normalized] ?? POSTAL_CODE_STATIONS["81243"];
}

export async function fetchDwdWeather(postalCode: string): Promise<DwdWeatherSnapshot> {
  const normalizedPostalCode = normalizePostalCode(postalCode) || "81243";
  const station = resolveDwdStation(normalizedPostalCode);
  let lastError: unknown;

  for (const endpoint of DWD_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8_000);
      const response = await fetch(`${endpoint}?stationIds=${station.stationId}`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (!response.ok) throw new Error(`DWD HTTP ${response.status}`);
      const payload = (await response.json()) as Record<string, DwdStationOverview | undefined>;
      const overview = payload[station.stationId];
      if (!overview?.forecast1) throw new Error("DWD payload incomplete");

      return normalizeWeatherSnapshot(normalizedPostalCode, station, overview);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("DWD weather unavailable");
}

function normalizeWeatherSnapshot(
  postalCode: string,
  station: { stationId: string; stationName: string },
  overview: DwdStationOverview,
): DwdWeatherSnapshot {
  const forecast = overview.forecast1 ?? {};
  const index = currentForecastIndex(forecast);
  const day = overview.days?.[0];
  const temperature = valueAt(forecast.temperature, index);
  const precipitation = valueAt(forecast.precipitationTotal, index);
  const precipitationProbability = valueAt(forecast.precipitationProbablity, index);
  const humidity = valueAt(forecast.humidity, index);
  const cloudCover = valueAt(forecast.cloudCoverTotal, index);
  const sunshine = valueAt(forecast.sunshine, index);
  const icon = valueAt(forecast.icon, index) ?? day?.icon ?? null;
  const condition = classifyCondition({
    icon,
    precipitation,
    cloudCover,
    sunshine,
    temperature,
  });

  return {
    postalCode,
    stationId: station.stationId,
    stationName: station.stationName,
    fetchedAt: Date.now(),
    temperatureC: toTenthUnit(temperature),
    minC: toTenthUnit(day?.temperatureMin ?? null),
    maxC: toTenthUnit(day?.temperatureMax ?? null),
    precipitationMm: toTenthUnit(precipitation ?? day?.precipitation ?? null),
    precipitationProbability: toTenthUnit(precipitationProbability),
    humidity: toTenthUnit(humidity),
    condition,
    conditionLabel: conditionLabel(condition),
  };
}

function currentForecastIndex(forecast: DwdForecast): number {
  const start = forecast.start ?? Date.now();
  const step = forecast.timeStep ?? 3_600_000;
  const rawIndex = Math.round((Date.now() - start) / step);
  const maxLength = forecast.temperature?.length ?? 1;
  return Math.max(0, Math.min(maxLength - 1, rawIndex));
}

function classifyCondition(input: {
  icon: number | null;
  precipitation: number | null;
  cloudCover: number | null;
  sunshine: number | null;
  temperature: number | null;
}): WeatherCondition {
  const icon = input.icon ?? 0;
  const precipitation = input.precipitation ?? 0;
  const cloudCover = input.cloudCover ?? 0;
  const sunshine = input.sunshine ?? 0;
  const temperature = input.temperature ?? 100;

  if ([38, 39, 45, 49].includes(icon)) return "storm";
  if (temperature <= 15 && precipitation > 0) return "snow";
  if (precipitation > 0 || [21, 22, 23, 24, 25, 26, 27].includes(icon)) return "rain";
  if ([40, 41, 42, 43, 44].includes(icon)) return "fog";
  if (sunshine >= 300 && cloudCover <= 45) return "sunny";
  if ([1, 2, 3].includes(icon)) return "sunny";
  return "cloudy";
}

function conditionLabel(condition: WeatherCondition): string {
  switch (condition) {
    case "sunny":
      return "Sonnig";
    case "rain":
      return "Regen";
    case "snow":
      return "Schnee";
    case "storm":
      return "Gewitter";
    case "fog":
      return "Nebel";
    case "cloudy":
    default:
      return "Bewölkt";
  }
}

function normalizePostalCode(postalCode: string): string {
  return postalCode.replace(/\D/g, "").slice(0, 5);
}

function valueAt(values: Array<number | null> | null | undefined, index: number): number | null {
  if (!values?.length) return null;
  return values[Math.max(0, Math.min(values.length - 1, index))] ?? null;
}

function toTenthUnit(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value / 10 : null;
}
