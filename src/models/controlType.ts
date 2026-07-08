/**
 * Canonical universal control identifiers. New controls may be registered
 * without extending this list; it exists purely as documentation and a
 * convenience type for the built-ins.
 */
export type BuiltinControlType =
  | "power.toggle"
  | "switch.glass"
  | "slider.percentage"
  | "slider.temperature"
  | "slider.position"
  | "slider.tilt"
  | "slider.volume"
  | "slider.color-temperature"
  | "stepper.numeric"
  | "picker.color"
  | "dropdown.enum"
  | "segmented.enum"
  | "media.transport"
  | "button.group"
  | "toggle.mute"
  | "lock.toggle"
  | "alarm.toggle"
  | "readout.boolean"
  | "readout.number"
  | "readout.text"
  | "readout.enum"
  | "readout.progress"
  | "readout.status"
  | "readout.energy"
  | "custom.generic";

export type ControlType = BuiltinControlType | (string & {});
