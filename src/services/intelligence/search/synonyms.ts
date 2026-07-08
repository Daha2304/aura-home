/**
 * Synonym-Skelett. Erweiterbar aus i18n / User-Aliases.
 * Keys sind Suchbegriffe (lowercased); Werte sind zusätzliche Tokens.
 */
export const searchSynonyms: Record<string, readonly string[]> = {
  licht: ["light", "lampe", "leuchte"],
  lampe: ["light", "licht"],
  fenster: ["window", "kontakt"],
  tür: ["door", "türe", "kontakt"],
  tuer: ["door"],
  heizung: ["heating", "thermostat"],
  klima: ["ac", "klimaanlage"],
  rollo: ["blinds", "rollladen", "jalousie"],
  steckdose: ["outlet"],
  kamera: ["camera"],
  sensor: ["sensors"],
};

export function expandSynonyms(token: string): string[] {
  const key = token.toLowerCase();
  const extra = searchSynonyms[key];
  return extra ? [key, ...extra] : [key];
}
