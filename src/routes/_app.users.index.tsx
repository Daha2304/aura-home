import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Search, User as UserIcon, ShieldCheck, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useUsersStore,
  selectAllUsers,
  selectCurrentUser,
} from "@/store/slices/usersStore";
import { userManager } from "@/services/users";

export const Route = createFileRoute("/_app/users/")({
  head: () => ({
    meta: [
      { title: "Benutzer · Smart Home" },
      { name: "description", content: "Benutzer, Profile und Rollen verwalten." },
    ],
  }),
  component: UsersPage,
});

type Filter = "all" | "active" | "admins" | "guests";

function UsersPage() {
  const users = useUsersStore(selectAllUsers);
  const current = useUsersStore(selectCurrentUser);
  const setCurrent = useUsersStore((s) => s.setCurrentUser);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = users;
    if (filter === "active") list = list.filter((u) => u.active !== false);
    else if (filter === "admins") list = list.filter((u) => u.isAdmin);
    else if (filter === "guests") list = list.filter((u) => u.isGuest);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(s));
    }
    return list;
  }, [users, q, filter]);

  const createUser = () => {
    const u = userManager.create({ name: "Neuer Benutzer" });
    setCurrent(u.id);
  };

  return (
    <>
      <PageHeader
        title="Benutzer"
        subtitle="Profile, Rollen und Berechtigungen"
        trailing={
          <button
            type="button"
            aria-label="Benutzer anlegen"
            onClick={createUser}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/15 text-accent"
          >
            <Plus className="h-5 w-5" />
          </button>
        }
      />

      {current && (
        <GlassCard className="mb-3 flex items-center gap-3">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white"
            style={{ background: current.color ?? "#3b82f6" }}
          >
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-lg font-semibold">{current.name}</div>
            <div className="text-xs text-muted-foreground">
              {current.isAdmin ? "Administrator" : current.isGuest ? "Gast" : "Benutzer"}
            </div>
          </div>
          <Link
            to="/users/$userId"
            params={{ userId: current.id }}
            className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent"
          >
            Öffnen
          </Link>
        </GlassCard>
      )}

      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Benutzer suchen"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto text-xs">
        {([
          ["all", "Alle"],
          ["active", "Aktiv"],
          ["admins", "Admins"],
          ["guests", "Gäste"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1.5 font-medium transition ${filter === k ? "bg-accent text-accent-foreground" : "bg-white/5 text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserIcon}
          title="Keine Benutzer"
          description="Lege einen neuen Benutzer an."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Link
              key={u.id}
              to="/users/$userId"
              params={{ userId: u.id }}
              className="block"
            >
              <GlassCard interactive className="flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                  style={{ background: u.color ?? "#3b82f6" }}
                >
                  {u.isAdmin ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : u.isGuest ? (
                    <UserRound className="h-5 w-5" />
                  ) : (
                    <UserIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">
                    {u.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {u.email ?? (u.isAdmin ? "Administrator" : u.isGuest ? "Gast" : "Benutzer")}
                  </div>
                </div>
                {u.id === current?.id && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    aktiv
                  </span>
                )}
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
