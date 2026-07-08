/**
 * Zentrales UI Design System — Barrel-Export.
 * Alle App-Komponenten importieren Präsentations-Primitive AUSSCHLIESSLICH
 * von hier. Basis: bestehende Glass-Komponenten.
 */

// Cards
export { GlassCard } from "@/components/glass/GlassCard";
export type { GlassCardProps } from "@/components/glass/GlassCard";
export { HeroCard } from "./cards/HeroCard";
export { SectionCard } from "./cards/SectionCard";
export { StatusCard } from "./cards/StatusCard";
export { MetricCard } from "./cards/MetricCard";
export { ActionCard } from "./cards/ActionCard";
export { InfoCard } from "./cards/InfoCard";
export { EmptyStateCard } from "./cards/EmptyStateCard";
export { LoadingCard } from "./cards/LoadingCard";
export { SkeletonCard } from "./cards/SkeletonCard";
export { DialogCard } from "./cards/DialogCard";
export { BottomSheet } from "./cards/BottomSheet";

// Controls
export { GlassButton } from "@/components/glass/GlassButton";
export type { GlassButtonProps } from "@/components/glass/GlassButton";
export { IconButton } from "./controls/IconButton";
export { FloatingButton } from "./controls/FloatingButton";
export { SegmentedControl } from "./controls/SegmentedControl";
export { StatusBadge } from "./controls/StatusBadge";
export { GlassInput } from "./controls/GlassInput";
export { GlassSwitch } from "./controls/GlassSwitch";
export { GlassSlider } from "./controls/GlassSlider";
export { GlassListItem } from "./controls/GlassListItem";

// Motion
export { PageTransition } from "./motion/PageTransition";
export { HeroTransition } from "./motion/HeroTransition";
export { CardTransition } from "./motion/CardTransition";
export { SharedLayout } from "./motion/SharedLayout";
export { TouchFeedback } from "./motion/TouchFeedback";
