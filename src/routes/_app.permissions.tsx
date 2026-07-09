import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useUsersStore, selectAllUsers } from "@/store/slices/usersStore";
import { resolveRolesForUser } from "@/services/users";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from "@/models/permission";
import { can } from "@/services/users";

export const Route = createFileRoute("/_app/permissions")({
  head: () => ({ meta: [{ title: "Berechtigungen · Smart Home" }] }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const users = useUsersStore(selectAllUsers);

  return (
    <>
      <Link to="/more" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Mehr
      </Link>
      <PageHeader
        title="Berechtigungen"
        subtitle="Effektive Zugriffsrechte pro Benutzer"
      />

      {users.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Keine Benutzer"
          description="Lege einen Benutzer an, um Berechtigungen zu prüfen."
        />
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const roles = resolveRolesForUser(u);
            return (
              <GlassCard key={u.id}>
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className="grid h-9 w-9 place-items-center rounded-xl text-white"
                    style={{ background: u.color ?? "#3b82f6" }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {u.name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {roles.map((r) => r.name).join(", ") || "keine Rolle"}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="py-1 pr-2 text-left font-normal">
                          Ressource
                        </th>
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
                                className={`inline-block h-1.5 w-1.5 rounded-full ${can(u, roles, act, res) ? "bg-emerald-400" : "bg-white/15"}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </>
  );
}
