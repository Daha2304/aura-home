import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { roleRegistry } from "@/services/users";
import { useRolesStore } from "@/store/slices/rolesStore";
import type { Role } from "@/models/role";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "@/models/permission";

export const Route = createFileRoute("/_app/roles")({
  head: () => ({ meta: [{ title: "Rollen · Smart Home" }] }),
  component: RolesPage,
});

function RolesPage() {
  const customRoles = useRolesStore((s) => s.customRoles);
  const builtin = roleRegistry.list().map<Role>((d) => roleRegistry.toRole(d));
  const all: Role[] = [...builtin, ...customRoles];

  return (
    <>
      <Link to="/more" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Mehr
      </Link>
      <PageHeader title="Rollen" subtitle="Rollen, Berechtigungen und Matrix" />

      <div className="space-y-3">
        {all.map((r) => (
          <GlassCard key={r.id}>
            <div className="mb-2 flex items-center gap-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                style={{ background: r.color ?? "#3b82f6" }}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[15px] font-semibold">
                  {r.name}
                  {r.builtin && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                      Built-in
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {r.description ?? "—"}
                </div>
              </div>
            </div>

            <Matrix role={r} />
          </GlassCard>
        ))}
      </div>
    </>
  );
}

function Matrix({ role }: { role: Role }) {
  const has = (resource: string, action: string) =>
    role.permissions.some(
      (g) =>
        g.resource === resource &&
        (g.action === action ||
          g.action === "manage" ||
          (g.action === "delete" && action !== "manage") ||
          (g.action === "edit" && (action === "read" || action === "control"))),
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-muted-foreground">
            <th className="py-1 pr-2 text-left font-normal">Ressource</th>
            {PERMISSION_ACTIONS.map((a) => (
              <th key={a} className="py-1 px-1 text-center font-normal capitalize">
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_RESOURCES.map((res) => (
            <tr key={res} className="border-t border-white/5">
              <td className="py-1 pr-2 capitalize">{res}</td>
              {PERMISSION_ACTIONS.map((act) => (
                <td key={act} className="py-1 px-1 text-center">
                  <span
                    aria-label={has(res, act) ? "erlaubt" : "verweigert"}
                    className={`inline-block h-1.5 w-1.5 rounded-full ${has(res, act) ? "bg-emerald-400" : "bg-white/15"}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
