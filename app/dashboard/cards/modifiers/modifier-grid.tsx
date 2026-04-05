"use client";

import { useRef, useState } from "react";
import { updateModifiers } from "@/app/actions/cards";
import type { CardRarity, SubscriptionTier, TierRarityModifier } from "@/app/types/cards";

const RARITIES: CardRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const TIERS: SubscriptionTier[] = ["1000", "2000", "3000"];
const TIER_LABELS: Record<SubscriptionTier, string> = {
  "1000": "Tier 1",
  "2000": "Tier 2",
  "3000": "Tier 3",
};

const RARITY_LABEL_CLASS: Record<CardRarity, string> = {
  common: "text-zinc-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
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
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full border-collapse bg-zinc-900 text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Rarity
              </th>
              {TIERS.map((tier) => (
                <th
                  key={tier}
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400"
                >
                  {TIER_LABELS[tier]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RARITIES.map((rarity, idx) => (
              <tr
                key={rarity}
                className={idx < RARITIES.length - 1 ? "border-b border-zinc-800" : ""}
              >
                <td className={`px-4 py-3 font-medium capitalize ${RARITY_LABEL_CLASS[rarity]}`}>
                  {rarity}
                </td>
                {TIERS.map((tier) => (
                  <td key={tier} className="px-4 py-3 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={grid[rarity][tier]}
                      disabled={pending}
                      className="w-20 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-center text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                      onChange={(e) => handleChange(rarity, tier, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md border border-green-800 bg-green-950 px-3 py-2 text-sm text-green-400">
          Modifiers saved successfully.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={pending}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={handleReset}
          disabled={pending}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
