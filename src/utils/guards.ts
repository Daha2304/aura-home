import type { Capability } from "@/models/capability";

export function capabilityOfKind<K extends Capability["kind"]>(
  capabilities: Capability[] | undefined,
  kind: K,
): Extract<Capability, { kind: K }> | undefined {
  return capabilities?.find((c) => c.kind === kind) as
    | Extract<Capability, { kind: K }>
    | undefined;
}
