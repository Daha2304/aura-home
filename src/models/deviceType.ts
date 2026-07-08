/**
 * Master-Liste aller unterstützten Gerätetypen.
 * Neue Typen können jederzeit über die {@link DeviceRegistry} als Plugin
 * hinzugefügt werden — ein Eintrag hier ist nur nötig, wenn der Typ
 * projektweit typsicher verwendet werden soll.
 */
export type DeviceTypeId =
  // Beleuchtung
  | "light"
  | "rgb"
  | "dimmer"
  // Steckdose
  | "outlet"
  // Beschattung / Öffnungen
  | "blinds"
  | "jalousie"
  | "awning"
  | "garage"
  | "door"
  | "window"
  | "doorContact"
  | "windowContact"
  // Sensoren
  | "motion"
  | "presence"
  | "temperature"
  | "humidity"
  | "pressure"
  | "co2"
  | "voc"
  | "smoke"
  | "water"
  | "sensor"
  // Klima
  | "thermostat"
  | "heating"
  | "ac"
  | "fan"
  // Media
  | "tv"
  | "avr"
  | "speaker"
  | "mediaPlayer"
  // Security
  | "camera"
  | "doorbell"
  | "alarm"
  // Energie
  | "energy"
  | "energyMeter"
  | "pv"
  | "battery"
  | "wallbox"
  // Sonstiges
  | "vacuum"
  | "custom";
