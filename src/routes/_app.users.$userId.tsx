import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Pencil, ShieldCheck, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { useUsersStore } from "@/store/slices/usersStore";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesStore";
import {
  resolveRolesForUser,
  userPreferencesManager,
} from "@/services/users";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useAutomationsStore } from "@/store/slices/automationsStore";

export const Route = createFileRoute("/_app/users/$userId")({
  head: () => ({ meta: [{ title: "Benutzer · Smart Home" }] }),
  component: UserDetail,
});

function UserDetail() {
  const { userId } = Route.useParams();
  const user = useUsersStore((s) => s.byId[userId]);
  const prefs = useUserPreferencesStore((s) => s.byUserId[userId]);
  const rooms = useRoomsStore((s) => s.rooms).filter(
    (r) => r.ownerUserId === userId || r.memberUserIds?.includes(userId),
  );
  const devices = useDevicesStore((s) => s.devices).filter(
    (d) => d.ownerUserId === userId,
  );
  const scenes = useScenesStore((s) => s.scenes).filter(
    (sc) => sc.ownerUserId === userId,
  );
  const automations = useAutomationsStore((s) => s.automations).filter(
    (a) => a.ownerUserId === userId,
  );

  if (!user) {
    return (
      <>
        <Link to="/users" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
          <ChevronLeft className="h-4 w-4" /> Benutzer
        </Link>
        <PageHeader title="Nicht gefunden" />
      </>
    );
  }

  const roles = resolveRolesForUser(user);
  const effective = userPreferencesManager.getEffective(user.id);

  return (
    <>
      <Link to="/users" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Benutzer
      </Link>
      <PageHeader
        title={user.name}
        subtitle={user.email ?? user.description ?? undefined}
        trailing={
          <Link
            to="/users/$userId/edit"
            params={{ userId }}
            aria-label="Bearbeiten"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent"
          >
            <Pencil className="h-5 w-5" />
          </Link>
        }
      />

      <GlassCard className="mb-3 flex items-center gap-3">
        <div
          className="grid h-16 w-16 place-items-center rounded-3xl text-white"
          style={{ background: user.color ?? "#3b82f6" }}
        >
          <UserIcon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold">{user.name}</div>
          <div className="text-xs text-muted-foreground">
            {user.isAdmin ? "Administrator" : user.isGuest ? "Gast" : "Benutzer"}
            {user.active === false && " · deaktiviert"}
          </div>
        </div>
      </GlassCard>

      <section className="mb-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Rollen
        </h2>
        <GlassCard>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs"
                style={{ color: r.color ?? undefined }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {r.name}
              </span>
            ))}
            {roles.length === 0 && (
              <span className="text-xs text-muted-foreground">Keine Rollen</span>
            )}
          </div>
        </GlassCard>
      </section>

      <section className="mb-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Einstellungen
        </h2>
        <GlassCard className="space-y-1 text-sm">
          <Row label="Sprache" value={effective.language ?? "—"} />
          <Row label="Einheiten" value={effective.units ?? "—"} />
          <Row label="Startseite" value={effective.homeRoute ?? "—"} />
          <Row label="Dashboard" value={effective.dashboardId ?? "—"} />
          <Row label="Favoriten" value={String(prefs?.favorites.length ?? 0)} />
        </GlassCard>
      </section>

      <section className="mb-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Zuständigkeit
        </h2>
        <GlassCard className="space-y-1 text-sm">
          <Row label="Räume" value={String(rooms.length)} />
          <Row label="Geräte" value={String(devices.length)} />
          <Row label="Szenen" value={String(scenes.length)} />
          <Row label="Automationen" value={String(automations.length)} />
        </GlassCard>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
