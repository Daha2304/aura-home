import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { profileManager } from "@/services/users";
import { useProfilesStore } from "@/store/slices/profilesStore";

export const Route = createFileRoute("/_app/profiles")({
  head: () => ({ meta: [{ title: "Profile · Smart Home" }] }),
  component: ProfilesPage,
});

function ProfilesPage() {
  // Subscribe to custom profiles so re-renders happen on change.
  useProfilesStore((s) => s.profiles);
  const profiles = profileManager.list();

  return (
    <>
      <Link to="/more" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Mehr
      </Link>
      <PageHeader title="Profile" subtitle="Familie, Kinder, Gast, Techniker" />

      <div className="space-y-2">
        {profiles.map((p) => (
          <GlassCard key={p.id} className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-2xl text-white"
              style={{ background: p.color }}
            >
              <span className="text-[10px] uppercase">{p.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 truncate text-[15px] font-semibold">
                {p.name}
                {p.builtin && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                    Built-in
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {p.description ?? "—"}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
