import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeviceCatalog } from "@/components/devices/catalog";
import { PageTransition } from "@/components/ds/motion/PageTransition";
import { useDevicesStore } from "@/store/slices/devicesStore";

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
  const total = useDevicesStore((s) => s.devices.length);
  const online = useDevicesStore((s) => s.devices.filter((d) => d.online).length);
  return (
    <PageTransition>
      <PageHeader
        title="Geräte"
        subtitle={`${total} Gerät${total === 1 ? "" : "e"} · ${online} online`}
      />
      <DeviceCatalog />
    </PageTransition>
  );
}
