"use client";

import { useRef, useState } from "react";
import { updateModifiers } from "@/app/actions/cards";
import type { CardRarity, SubscriptionTier, TierRarityModifier } from "@/app/types/cards";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RARITIES, RARITY_CONFIG } from "@/lib/rarity";

const TIERS: SubscriptionTier[] = ["1000", "2000", "3000"];
const TIER_LABELS: Record<SubscriptionTier, string> = {
  "1000": "Tier 1",
  "2000": "Tier 2",
  "3000": "Tier 3",
};

type Grid = Record<CardRarity, Record<SubscriptionTier, number>>;

export function buildGrid(modifiers: TierRarityModifier[]): Grid {
  const grid = {} as Grid;
  for (const rarity of RARITIES) {
    grid[rarity] = {} as Record<SubscriptionTier, number>;
    for (const tier of TIERS) {
      grid[rarity][tier] = 1.0;
    }
  }
  for (const mod of modifiers) {
    if (grid[mod.rarity] && TIERS.includes(mod.tier)) {
      grid[mod.rarity][mod.tier] = mod.weightMultiplier;
    }
  }
  return grid;
}

interface ModifierGridProps {
  initialModifiers: TierRarityModifier[];
}

export function ModifierGrid({ initialModifiers }: ModifierGridProps) {
  const [grid, setGrid] = useState<Grid>(() => buildGrid(initialModifiers));
  const original = useRef<Grid>(buildGrid(initialModifiers));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(rarity: CardRarity, tier: SubscriptionTier, value: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setGrid((prev) => ({
      ...prev,
      [rarity]: { ...prev[rarity], [tier]: num },
    }));
  }

  function handleReset() {
    setGrid(buildGrid(initialModifiers));
    original.current = buildGrid(initialModifiers);
    setError(null);
    setSuccess(false);
  }

  async function handleSave() {
    const changed: Array<{ tier: SubscriptionTier; rarity: CardRarity; weightMultiplier: number }> = [];

    for (const rarity of RARITIES) {
      for (const tier of TIERS) {
        if (grid[rarity][tier] !== original.current[rarity][tier]) {
          changed.push({ tier, rarity, weightMultiplier: grid[rarity][tier] });
        }
      }
    }

    if (changed.length === 0) {
      setSuccess(false);
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateModifiers({ modifiers: changed });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        setError("Failed to save modifiers. Please try again.");
        return;
      }
      const newGrid = buildGrid(result.data);
      setGrid(newGrid);
      original.current = newGrid;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rarity
              </TableHead>
              {TIERS.map((tier) => (
                <TableHead
                  key={tier}
                  className="text-center text-xs font-semibold uppercase tracking-wider text-foreground"
                >
                  {TIER_LABELS[tier]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {RARITIES.map((rarity) => (
              <TableRow key={rarity}>
                <TableCell
                  className={`font-medium capitalize ${RARITY_CONFIG[rarity].text}`}
                >
                  {rarity}
                </TableCell>
                {TIERS.map((tier) => (
                  <TableCell key={tier} className="text-center">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={grid[rarity][tier]}
                      disabled={pending}
                      className="w-20 text-center mx-auto"
                      onChange={(e) => handleChange(rarity, tier, e.target.value)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Modifiers saved successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={pending}>
          Reset
        </Button>
      </div>
    </div>
  );
}
