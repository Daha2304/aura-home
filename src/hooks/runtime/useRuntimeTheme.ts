import { useEffect } from "react";
import { useRuntimeStore } from "@/store/slices/runtimeStore";

/**
 * Wendet Theme aus RuntimeStore auf <html data-theme> an und folgt
 * prefers-color-scheme bei "auto".
 */
export function useRuntimeTheme() {
  const theme = useRuntimeStore((s) => s.theme);
  const setEffective = useRuntimeStore((s) => s.setEffectiveTheme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      let eff: "light" | "dark" = "light";
      if (theme === "dark") eff = "dark";
      else if (theme === "light") eff = "light";
      else eff = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.dataset.theme = eff;
      document.documentElement.classList.toggle("dark", eff === "dark");
      setEffective(eff);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "auto") apply();
    };
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, [theme, setEffective]);
}
