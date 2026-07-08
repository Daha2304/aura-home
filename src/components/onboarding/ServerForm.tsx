import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type {
  ServerAuthType,
  ServerDraft,
  ServerValidationErrors,
} from "@/models/server";
import { validateServerConfig } from "@/models/server";

interface ServerFormProps {
  draft: ServerDraft;
  onChange: (patch: ServerDraft) => void;
  showErrors?: boolean;
}

export function useServerFormValidation(draft: ServerDraft) {
  return useMemo(() => validateServerConfig(draft), [draft]);
}

export function ServerForm({ draft, onChange, showErrors }: ServerFormProps) {
  const { errors } = useServerFormValidation(draft);
  const err = (k: keyof ServerValidationErrors) =>
    showErrors ? errors[k] : undefined;

  const patchAuth = (patch: Partial<NonNullable<ServerDraft["auth"]>>) =>
    onChange({ auth: { ...(draft.auth ?? {}), ...patch } });

  return (
    <div className="space-y-6">
      <Section title="Grunddaten">
        <Field label="Name" error={err("name")}>
          <TextInput
            value={draft.name ?? ""}
            onChange={(v) => onChange({ name: v })}
            placeholder="Wohnzimmer-Server"
            autoFocus
          />
        </Field>
        <Field label="Beschreibung">
          <TextInput
            value={draft.description ?? ""}
            onChange={(v) => onChange({ description: v })}
            placeholder="Optional"
          />
        </Field>
      </Section>

      <Section title="Verbindung">
        <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
          <Field label="Host" error={err("host")}>
            <TextInput
              value={draft.host ?? ""}
              onChange={(v) => onChange({ host: v })}
              placeholder="192.168.1.10"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Port" error={err("port")}>
            <TextInput
              value={draft.port !== undefined ? String(draft.port) : ""}
              onChange={(v) => {
                const n = parseInt(v, 10);
                onChange({ port: Number.isNaN(n) ? undefined : n });
              }}
              placeholder="8099"
              inputMode="numeric"
            />
          </Field>
        </div>
        <Field label="Pfad" error={err("path")}>
          <TextInput
            value={draft.path ?? ""}
            onChange={(v) => onChange({ path: v || undefined })}
            placeholder="/ws (optional)"
            autoCapitalize="none"
          />
        </Field>
        <Toggle
          label="SSL / TLS"
          description="Verwendet wss:// statt ws://"
          checked={!!draft.ssl}
          onChange={(ssl) => onChange({ ssl })}
        />
      </Section>

      <Section title="Authentifizierung">
        <AuthPicker
          value={(draft.auth?.type as ServerAuthType) ?? "none"}
          onChange={(type) => patchAuth({ type })}
        />
        {draft.auth?.type === "password" && (
          <Field label="Passwort" error={err("auth.password")}>
            <TextInput
              type="password"
              value={draft.auth?.password ?? ""}
              onChange={(v) => patchAuth({ password: v })}
            />
          </Field>
        )}
        {draft.auth?.type === "token" && (
          <Field label="Token" error={err("auth.token")}>
            <TextInput
              type="password"
              value={draft.auth?.token ?? ""}
              onChange={(v) => patchAuth({ token: v })}
            />
          </Field>
        )}
        {draft.auth?.type === "basic" && (
          <>
            <Field label="Benutzername" error={err("auth.username")}>
              <TextInput
                value={draft.auth?.username ?? ""}
                onChange={(v) => patchAuth({ username: v })}
                autoCapitalize="none"
              />
            </Field>
            <Field label="Passwort" error={err("auth.password")}>
              <TextInput
                type="password"
                value={draft.auth?.password ?? ""}
                onChange={(v) => patchAuth({ password: v })}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="Optionen">
        <Toggle
          label="Automatisch verbinden"
          description="Beim App-Start automatisch verbinden"
          checked={draft.autoConnect ?? true}
          onChange={(autoConnect) => onChange({ autoConnect })}
        />
        <Toggle
          label="Als Favorit markieren"
          checked={!!draft.favorite}
          onChange={(favorite) => onChange({ favorite })}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <div className="glass-panel space-y-3 rounded-2xl p-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
      {error && (
        <motion.div
          className="mt-1 text-xs text-destructive"
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      {...rest}
    />
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-left"
      role="switch"
      aria-checked={checked}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-white/15",
        )}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  );
}

function AuthPicker({
  value,
  onChange,
}: {
  value: ServerAuthType;
  onChange: (v: ServerAuthType) => void;
}) {
  const options: Array<{ id: ServerAuthType; label: string }> = [
    { id: "none", label: "Keine" },
    { id: "password", label: "Passwort" },
    { id: "token", label: "Token" },
    { id: "basic", label: "Basic" },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-white/5 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "relative rounded-lg px-2 py-2 text-xs font-medium transition-colors",
            value === o.id
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {value === o.id && (
            <motion.span
              layoutId="auth-picker"
              className="absolute inset-0 rounded-lg bg-primary"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
