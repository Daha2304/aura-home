import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUsersStore } from "@/store/slices/usersStore";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/_app/settings/users")({
  component: UsersSettings,
});

function UsersSettings() {
  const users = useUsersStore((s) => s.users);
  return (
    <>
      <Link
        to="/settings"
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Benutzer" subtitle="Rollen: Admin, Benutzer, Gast" />
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Keine Benutzer"
          description="Mehrbenutzer-Verwaltung wird geladen, sobald der Server sie unterstützt."
        />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <GlassCard key={u.id} className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{u.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {u.role}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
