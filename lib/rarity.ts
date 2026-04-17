import type { CardRarity } from "@/app/types/cards";

export const RARITIES: CardRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const RARITY_CONFIG: Record<
  CardRarity,
  { bg: string; text: string; border: string; label: string }
> = {
  common: {
    bg: "bg-zinc-800/60",
    text: "text-rarity-common",
    border: "border-zinc-700",
    label: "Común",
  },
  uncommon: {
    bg: "bg-green-950/60",
    text: "text-rarity-uncommon",
    border: "border-green-800",
    label: "Poco común",
  },
  rare: {
    bg: "bg-blue-950/60",
    text: "text-rarity-rare",
    border: "border-blue-800",
    label: "Rara",
  },
  epic: {
    bg: "bg-purple-950/60",
    text: "text-rarity-epic",
    border: "border-purple-800",
    label: "Épica",
  },
  legendary: {
    bg: "bg-amber-950/60",
    text: "text-rarity-legendary",
    border: "border-amber-800",
    label: "Legendaria",
  },
};

export function rarityClasses(rarity: CardRarity): string {
  const config = RARITY_CONFIG[rarity];
  return `${config.bg} ${config.text} ${config.border}`;
}
