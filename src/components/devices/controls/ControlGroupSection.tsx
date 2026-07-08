import { memo, type ReactNode } from "react";
import { SectionCard } from "@/components/ds/cards/SectionCard";
import type { CapabilityCategory } from "@/models/capabilityDescriptor";

const GROUP_LABEL: Record<CapabilityCategory, string> = {
  general: "Allgemein",
  lighting: "Beleuchtung",
  climate: "Klima",
  media: "Medien",
  sensor: "Sensoren",
  energy: "Energie",
  network: "Netzwerk",
  system: "System",
  custom: "Benutzerdefiniert",
};

export interface ControlGroupSectionProps {
  category: CapabilityCategory;
  children: ReactNode;
}

export const ControlGroupSection = memo(function ControlGroupSection({
  category,
  children,
}: ControlGroupSectionProps) {
  return (
    <SectionCard title={GROUP_LABEL[category]} className="mt-4">
      <div className="flex flex-col gap-4">{children}</div>
    </SectionCard>
  );
});
