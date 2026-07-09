import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { useUsersStore } from "@/store/slices/usersStore";
import { userManager, profileManager, roleRegistry } from "@/services/users";
import { useRolesStore } from "@/store/slices/rolesStore";

export const Route = createFileRoute("/_app/users/$userId/edit")({
  head: () => ({ meta: [{ title: "Benutzer bearbeiten · Smart Home" }] }),
  component: EditUserPage,
});

function EditUserPage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const user = useUsersStore((s) => s.byId[userId]);
  const customRoles = useRolesStore((s) => s.customRoles);

  const [form, setForm] = useState(() => user);

  useEffect(() => setForm(user), [user]);

  if (!form) {
    return (
      <>
        <Link to="/users" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
          <ChevronLeft className="h-4 w-4" /> Benutzer
        </Link>
        <PageHeader title="Nicht gefunden" />
      </>
    );
  }

  const save = () => {
    userManager.update(userId, form);
    navigate({ to: "/users/$userId", params: { userId } });
  };

  const remove = () => {
    userManager.remove(userId);
    navigate({ to: "/users" });
  };

  const allRoles = [
    ...roleRegistry.list().map((r) => ({ id: r.id, name: r.name })),
    ...customRoles.map((r) => ({ id: r.id, name: r.name })),
  ];
  const profiles = profileManager.list();

  return (
    <>
      <Link
        to="/users/$userId"
        params={{ userId }}
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Zurück
      </Link>
      <PageHeader title="Bearbeiten" subtitle={form.name} />

      <GlassCard className="space-y-3">
        <Field
          label="Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Vorname"
            value={form.firstName ?? ""}
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
          <Field
            label="Nachname"
            value={form.lastName ?? ""}
            onChange={(v) => setForm({ ...form, lastName: v })}
          />
        </div>
        <Field
          label="E-Mail"
          value={form.email ?? ""}
          onChange={(v) => setForm({ ...form, email: v })}
        />
        <Field
          label="Telefon"
          value={form.phone ?? ""}
          onChange={(v) => setForm({ ...form, phone: v })}
        />
        <Field
          label="Beschreibung"
          value={form.description ?? ""}
          onChange={(v) => setForm({ ...form, description: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Sprache"
            value={form.language ?? ""}
            onChange={(v) => setForm({ ...form, language: v })}
            placeholder="de-DE"
          />
          <Field
            label="Zeitzone"
            value={form.timezone ?? ""}
            onChange={(v) => setForm({ ...form, timezone: v })}
            placeholder="Europe/Berlin"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-muted-foreground">Farbe</span>
            <input
              type="color"
              value={form.color ?? "#3b82f6"}
              onChange={(e) => setForm({ ...form, color: e.target.value as `#${string}` })}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5"
            />
          </label>
          <label className="flex flex-col text-xs">
            <span className="mb-1 text-muted-foreground">Profil</span>
            <select
              value={form.profileId ?? ""}
              onChange={(e) =>
                setForm({ ...form, profileId: e.target.value || undefined })
              }
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-2 text-sm"
            >
              <option value="">—</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col text-xs">
          <span className="mb-1 text-muted-foreground">Rollen</span>
          <select
            multiple
            value={form.roleIds ?? []}
            onChange={(e) =>
              setForm({
                ...form,
                roleIds: Array.from(e.target.selectedOptions).map(
                  (o) => o.value,
                ),
              })
            }
            className="min-h-24 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-sm"
          >
            {allRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-4 pt-1 text-sm">
          <Toggle
            label="Aktiv"
            checked={form.active !== false}
            onChange={(v) => setForm({ ...form, active: v })}
          />
          <Toggle
            label="Admin"
            checked={!!form.isAdmin}
            onChange={(v) => setForm({ ...form, isAdmin: v })}
          />
          <Toggle
            label="Gast"
            checked={!!form.isGuest}
            onChange={(v) => setForm({ ...form, isGuest: v })}
          />
        </div>
      </GlassCard>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground"
        >
          Speichern
        </button>
        <button
          type="button"
          onClick={remove}
          aria-label="Benutzer löschen"
          className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/15 text-red-500"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col text-xs">
      <span className="mb-1 text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  );
}
