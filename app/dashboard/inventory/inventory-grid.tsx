"use client";

import { useState, useTransition } from "react";
import { getInventoryAction } from "@/app/actions/inventory";
import type { CardRarity, InventoryFilters, UserCard } from "@/app/types/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RARITIES, RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface InventoryGridProps {
  initialCards: UserCard[];
  total: number;
}

type ActiveFilter = "all" | "active" | "inactive";

function RarityBadge({ rarity }: { rarity: CardRarity }) {
  const config = RARITY_CONFIG[rarity];
  return (
    <Badge
      variant="outline"
      className={cn(
        "border capitalize",
        config.bg,
        config.text,
        config.border
      )}
    >
      {rarity}
    </Badge>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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

  function handleRarityChange(value: string | null) {
    const rarity = value as CardRarity | "all";
    setSelectedRarity(rarity);
    setExpandedId(null);
    applyFilters(rarity, activeFilter);
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
        <Select
          value={selectedRarity}
          onValueChange={handleRarityChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All rarities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rarities</SelectItem>
            {RARITIES.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex overflow-hidden rounded-lg border border-border">
          {(["all", "active", "inactive"] as ActiveFilter[]).map((option) => (
            <Button
              key={option}
              onClick={() => handleActiveChange(option)}
              disabled={isPending}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-none capitalize",
                activeFilter === option && "bg-muted text-foreground"
              )}
            >
              {option}
            </Button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted-foreground">
          {isPending ? "Loading…" : `${totalCount} cards`}
        </span>
      </div>

      {/* Loading skeleton */}
      {isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isPending && cards.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="text-sm text-muted-foreground">No cards found</p>
          <p className="text-xs text-muted-foreground/60">Try adjusting your filters</p>
        </div>
      )}

      {/* Card grid */}
      {!isPending && cards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col gap-2">
              <button
                onClick={() => toggleExpand(card.id)}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border/70 hover:bg-card/80",
                  !card.isActive && "opacity-50"
                )}
              >
                {/* Card image */}
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {card.template.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.template.imageUrl}
                      alt={card.template.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}

                  {/* Level badge — top left */}
                  <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-foreground">
                    Lv. {card.level}
                  </span>

                  {/* Rarity badge — bottom right */}
                  <span
                    className={cn(
                      "absolute bottom-1.5 right-1.5 rounded border px-1.5 py-0.5 text-xs font-medium capitalize",
                      RARITY_CONFIG[card.template.rarity as CardRarity]?.bg ?? "bg-muted",
                      RARITY_CONFIG[card.template.rarity as CardRarity]?.text ?? "text-muted-foreground",
                      RARITY_CONFIG[card.template.rarity as CardRarity]?.border ?? "border-border"
                    )}
                  >
                    {card.template.rarity}
                  </span>
                </div>

                {/* Card name */}
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-foreground">
                    {card.template.name}
                  </p>
                </div>
              </button>

              {/* Expanded stats panel */}
              {expandedId === card.id && (
                <Card size="sm">
                  <CardContent className="flex flex-col gap-1 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        {card.template.name}
                      </span>
                      <RarityBadge rarity={card.template.rarity as CardRarity} />
                    </div>
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
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
