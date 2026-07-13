import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/order-statuses")({
  beforeLoad: () => { throw redirect({ to: "/admin/settings" }); },
  component: () => null,
});
