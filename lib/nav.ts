import {
  LayoutDashboard,
  Layers,
  Target,
  CreditCard,
  Swords,
  Settings,
  Monitor,
  Sparkles,
  Grid3X3,
  Dices,
  Puzzle,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiresStreamer?: boolean;
  requiresAdmin?: boolean;
  children?: Omit<NavItem, "children" | "icon">[];
}

export const NAV_GENERAL: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Colección",
    href: "/dashboard/inventory",
    icon: Layers,
  },
  {
    title: "Misiones",
    href: "/dashboard/missions",
    icon: Target,
  },
  {
    title: "Cartas Físicas",
    href: "/dashboard/physical-cards",
    icon: CreditCard,
  },
];

export const NAV_STREAMER: NavItem[] = [
  {
    title: "Gestión de Cartas",
    href: "/dashboard/cards",
    icon: Sparkles,
    requiresStreamer: true,
    children: [
      { title: "Categorías", href: "/dashboard/cards", requiresStreamer: true },
      {
        title: "Templates",
        href: "/dashboard/cards/templates",
        requiresStreamer: true,
      },
      { title: "Pool", href: "/dashboard/cards/pool", requiresStreamer: true },
      {
        title: "Modificadores",
        href: "/dashboard/cards/modifiers",
        requiresStreamer: true,
      },
      {
        title: "Simular Drop",
        href: "/dashboard/cards/drop",
        requiresStreamer: true,
        requiresAdmin: true,
      },
    ],
  },
  {
    title: "Batallas",
    href: "/dashboard/battles",
    icon: Swords,
    requiresStreamer: true,
  },
  {
    title: "Overlay",
    href: "#overlay",
    icon: Monitor,
    requiresStreamer: true,
  },
  {
    title: "Ajustes",
    href: "/dashboard/settings",
    icon: Settings,
    requiresStreamer: true,
  },
];
