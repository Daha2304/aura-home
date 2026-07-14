import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="relative flex h-dvh min-h-dvh flex-col overflow-hidden">
      <main
        id="app-scroll-root"
        className="mx-auto min-h-0 w-full max-w-md flex-1 overflow-y-auto px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-6"
      >
        <OfflineBanner />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
