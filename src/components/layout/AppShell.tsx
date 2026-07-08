import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="relative min-h-dvh">
      <main
        className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32"
        style={{ minHeight: "100dvh" }}
      >
        <OfflineBanner />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
