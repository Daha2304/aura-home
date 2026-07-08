import { useEffect } from "react";
import { useUiStore } from "@/store/slices/uiStore";

export function useThemeEffect(): void {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const apply = () => {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };

    apply();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);
}
