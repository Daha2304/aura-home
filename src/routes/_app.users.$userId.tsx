import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/users/$userId")({
  component: () => <Outlet />,
});
