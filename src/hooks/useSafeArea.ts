import { useEffect, useState } from "react";

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => {
      const s = getComputedStyle(document.documentElement);
      const parse = (v: string) => parseFloat(v || "0") || 0;
      setInsets({
        top: parse(s.getPropertyValue("--sa-top")),
        right: parse(s.getPropertyValue("--sa-right")),
        bottom: parse(s.getPropertyValue("--sa-bottom")),
        left: parse(s.getPropertyValue("--sa-left")),
      });
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  return insets;
}
