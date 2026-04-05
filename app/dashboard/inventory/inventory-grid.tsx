"use client";

import { useState, useTransition } from "react";
import { getInventoryAction } from "@/app/actions/inventory";
import type { CardRarity, InventoryFilters, UserCard } from "@/app/types/cards";

interface InventoryGridProps {
  initialCards: UserCard[];
  total: number;
}

const RARITY_BADGE: Record<CardRarity, string> = {
  common: "bg-zinc-700 text-zinc-300",
  uncommon: "bg-green-900 text-green-300",
  rare: "bg-blue-900 text-blue-300",
  epic: "bg-purple-900 text-purple-300",
  legendary: "bg-amber-900 text-amber-300",
};

const RARITIES: CardRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

type ActiveFilter = "all" | "active" | "inactive";

function RarityBadge({ rarity }: { rarity: CardRarity }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${RARITY_BADGE[rarity as CardRarity]}`}
    >
      {rarity}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

export function InventoryGrid({ initialCards, total }: InventoryGridProps) {
  const [cards, setCards] = useState<UserCard[]>(initialCards);
  const [totalCount, setTotalCount] = useState(total);
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | "all">("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(rarity: CardRarity | "all", active: ActiveFilter) {
    const filters: InventoryFilters = { limit: 20 };
    if (rarity !== "all") filters.rarity = rarity;
    if (active === "active") filters.isActive = true;
    if (active === "inactive") filters.isActive = false;

    startTransition(async () => {
      const result = await getInventoryAction(filters);
      setCards(result.data);
      setTotalCount(result.total);
    });
  }

  function handleRarityChange(value: CardRarity | "all") {
    setSelectedRarity(value);
    setExpandedId(null);
    applyFilters(value, activeFilter);
  }

  function handleActiveChange(value: ActiveFilter) {
    setActiveFilter(value);
    setExpandedId(null);
    applyFilters(selectedRarity, value);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedRarity}
          onChange={(e) => handleRarityChange(e.target.value as CardRarity | "all")}
          disabled={isPending}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
        >
          <option value="all">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r} className="capitalize">
              {r}
            </option>
          ))}
        </select>

        <div className="flex overflow-hidden rounded-md border border-zinc-700">
          {(["all", "active", "inactive"] as ActiveFilter[]).map((option) => (
            <button
              key={option}
              onClick={() => handleActiveChange(option)}
              disabled={isPending}
              className={`px-3 py-1.5 text-sm capitalize transition-colors disabled:opacity-50 ${
                activeFilter === option
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-zinc-500">
          {isPending ? "Loading…" : `${totalCount} cards`}
        </span>
      </div>

      {/* Loading overlay hint */}
      {isPending && (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-zinc-500">Loading…</span>
        </div>
      )}

      {/* Empty state */}
      {!isPending && cards.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="text-sm text-zinc-500">No cards found</p>
          <p className="text-xs text-zinc-600">Try adjusting your filters</p>
        </div>
      )}

      {/* Card grid */}
      {!isPending && cards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col gap-2">
              <button
                onClick={() => toggleExpand(card.id)}
                className={`group relative flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700 ${
                  !card.isActive ? "opacity-50" : ""
                }`}
              >
                {/* Card image */}
                <div className="relative aspect-square w-full overflow-hidden bg-zinc-800">
                  {card.template.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.template.imageUrl}
                      alt={card.template.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                      No img
                    </div>
                  )}

                  {/* Level badge — top left */}
                  <span className="absolute left-1.5 top-1.5 rounded bg-zinc-950/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                    Lv. {card.level}
                  </span>

                  {/* Rarity badge — bottom right */}
                  <span
                    className={`absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                      RARITY_BADGE[card.template.rarity as CardRarity] ?? "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {card.template.rarity}
                  </span>
                </div>

                {/* Card name */}
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-white">
                    {card.template.name}
                  </p>
                </div>
              </button>

              {/* Expanded stats panel */}
              {expandedId === card.id && (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-white">{card.template.name}</span>
                    <RarityBadge rarity={card.template.rarity as CardRarity} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <StatRow label="Level" value={card.level} />
                    <StatRow label="XP" value={card.xp} />
                    <StatRow label="Attack" value={card.attack} />
                    <StatRow label="Defense" value={card.defense} />
                    <StatRow label="Agility" value={card.agility} />
                    <StatRow label="Obtained via" value={card.obtainedVia} />
                    <StatRow
                      label="Obtained at"
                      value={new Date(card.obtainedAt).toLocaleDateString()}
                    />
                    <StatRow label="Status" value={card.isActive ? "Active" : "Inactive"} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
