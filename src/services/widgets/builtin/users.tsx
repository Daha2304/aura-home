import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import { User as UserIcon, Users, UserCog, Home } from "lucide-react";
import {
  useUsersStore,
  selectCurrentUser,
  selectActiveUsers,
} from "@/store/slices/usersStore";
import { useProfilesStore } from "@/store/slices/profilesStore";
import { profileRegistry } from "@/services/users/ProfileRegistry";

const ALL_LAYOUTS = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
] as const;

function CurrentUserWidget() {
  const user = useUsersStore(selectCurrentUser);
  return (
    <div className="grid h-full place-items-center p-3">
      <div className="flex flex-col items-center gap-1 text-center">
        <div
          className="grid h-10 w-10 place-items-center rounded-full text-white"
          style={{ background: user?.color ?? "#3b82f6" }}
        >
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold">
          {user?.name ?? "Kein Benutzer"}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {user?.isAdmin ? "Administrator" : user?.isGuest ? "Gast" : "Benutzer"}
        </div>
      </div>
    </div>
  );
}

function UserSwitcherWidget() {
  const users = useUsersStore(selectActiveUsers);
  const setCurrent = useUsersStore((s) => s.setCurrentUser);
  const currentId = useUsersStore((s) => s.currentUserId);
  return (
    <div className="h-full overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <UserCog className="h-4 w-4" /> Benutzer wechseln
      </div>
      <ul className="space-y-1 overflow-y-auto text-xs">
        {users.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => setCurrent(u.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition ${u.id === currentId ? "bg-accent/15 text-accent" : "hover:bg-white/5"}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: u.color ?? "#3b82f6" }}
              />
              <span className="truncate">{u.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickProfilesWidget() {
  const profiles = [
    ...profileRegistry.list(),
    ...useProfilesStore((s) => s.profiles).filter((p) => !p.builtin),
  ];
  return (
    <div className="h-full overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Home className="h-4 w-4" /> Profile
      </div>
      <ul className="space-y-1 overflow-y-auto text-xs">
        {profiles.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="truncate">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FamilyOverviewWidget() {
  const users = useUsersStore(selectActiveUsers);
  return (
    <div className="h-full overflow-hidden p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Users className="h-4 w-4" /> Familie
      </div>
      <div className="grid grid-cols-2 gap-2">
        {users.slice(0, 6).map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-xs"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: u.color ?? "#3b82f6" }}
            />
            <span className="truncate">{u.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const descriptors = [
  defineWidget({
    id: "user.current",
    name: "Aktueller Benutzer",
    category: "system",
    description: "Zeigt den aktuell aktiven Benutzer.",
    icon: "user",
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <CurrentUserWidget />,
  }),
  defineWidget({
    id: "user.switcher",
    name: "Benutzer wechseln",
    category: "system",
    description: "Schneller Wechsel zwischen aktiven Benutzern.",
    icon: "user-cog",
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <UserSwitcherWidget />,
  }),
  defineWidget({
    id: "user.quick-profiles",
    name: "Profile",
    category: "system",
    description: "Übersicht der verfügbaren Profile.",
    icon: "home",
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <QuickProfilesWidget />,
  }),
  defineWidget({
    id: "user.family-overview",
    name: "Familie",
    category: "system",
    description: "Alle aktiven Benutzer im Überblick.",
    icon: "users",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 5 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <FamilyOverviewWidget />,
  }),
];

let registered = false;
export function registerUserWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const USER_WIDGET_IDS = descriptors.map((d) => d.id);
