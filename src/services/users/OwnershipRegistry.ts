/**
 * Registry of ownership sources per refType. Domain code registers a
 * descriptor here that reads its Ownership out of the domain store;
 * the PermissionEvaluator can then evaluate `scope: "own"` / "shared"
 * uniformly without a switch.
 */
import type { ID } from "@/models/common";
import type { Ownership, OwnershipRefType } from "@/models/ownership";

export interface OwnershipSourceDescriptor {
  refType: OwnershipRefType;
  read(refId: ID): Ownership | undefined;
}

export class OwnershipRegistry {
  private readonly sources = new Map<OwnershipRefType, OwnershipSourceDescriptor>();

  registerOwnershipSource(desc: OwnershipSourceDescriptor): void {
    this.sources.set(desc.refType, desc);
  }
  read(refType: OwnershipRefType, refId: ID): Ownership | undefined {
    return this.sources.get(refType)?.read(refId);
  }
  hasSource(refType: OwnershipRefType): boolean {
    return this.sources.has(refType);
  }
}

export const ownershipRegistry = new OwnershipRegistry();
