import { useUiStore } from "@/store/slices/uiStore";
import { de, type Dictionary } from "./locales/de";
import { en } from "./locales/en";

const dictionaries: Record<string, Dictionary> = { de, en };

export function useT(): Dictionary {
  const lang = useUiStore((s) => s.language);
  return dictionaries[lang] ?? de;
}
