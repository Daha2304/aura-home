import { createFileRoute } from "@tanstack/react-router";

const DWD_URL = "https://app-prod-ws.warnwetter.de/v30/stationOverviewExtended";

export const Route = createFileRoute("/api/dwd-weather/stationOverviewExtended")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const stationIds = sanitizeStationIds(url.searchParams.get("stationIds"));

        if (!stationIds) {
          return Response.json({ error: "stationIds missing" }, { status: 400 });
        }

        const upstream = await fetch(`${DWD_URL}?stationIds=${stationIds}`, {
          headers: {
            accept: "application/json",
          },
        });

        const body = await upstream.text();
        return new Response(body, {
          status: upstream.status,
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "application/json",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});

function sanitizeStationIds(value: string | null): string {
  return value
    ?.split(",")
    .map((part) => part.trim())
    .filter((part) => /^\d+$/.test(part))
    .join(",") ?? "";
}
