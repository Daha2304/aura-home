import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeviceList } from "@/components/devices/DeviceList";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/devices")({
  head: () => ({ meta: [{ title: "Geräte · Smart Home" }] }),
  component: DevicesLayout,
});

function DevicesLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/devices") return <Outlet />;
  return <DevicesIndex />;
}

function DevicesIndex() {
  const devices = useDevicesStore((s) => s.devices);
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      query.trim().length === 0
        ? devices
        : devices.filter((d) =>
            d.name.toLowerCase().includes(query.toLowerCase()),
          ),
    [devices, query],
  );

  return (
    <>
      <PageHeader
        title="Geräte"
        subtitle={`${devices.length} Gerät${devices.length === 1 ? "" : "e"} insgesamt`}
      />
      <div className="mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Geräte suchen …"
          className="glass-panel !border-0 !bg-transparent"
        />
      </div>
      <DeviceList devices={filtered} />
    </>
  );
}
