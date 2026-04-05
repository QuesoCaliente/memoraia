"use client";

import { useState } from "react";
import { updatePoolEntry } from "@/app/actions/cards";
import type { CardRarity, PoolEntry } from "@/app/types/cards";

interface PoolListProps {
  initialEntries: PoolEntry[];
}

const RARITY_BADGE: Record<CardRarity, string> = {
  common: "bg-zinc-700 text-zinc-300",
  uncommon: "bg-green-900 text-green-300",
  rare: "bg-blue-900 text-blue-300",
  epic: "bg-purple-900 text-purple-300",
  legendary: "bg-amber-900 text-amber-300",
};

function RarityBadge({ rarity }: { rarity: CardRarity }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${RARITY_BADGE[rarity]}`}>
      {rarity}
    </span>
  );
}

interface RowState {
  pending: boolean;
  error: string | null;
}

export function PoolList({ initialEntries }: PoolListProps) {
  const [entries, setEntries] = useState<PoolEntry[]>(initialEntries);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({});

  function getRow(templateId: string): RowState {
    return rowState[templateId] ?? { pending: false, error: null };
  }

  function setRow(templateId: string, state: Partial<RowState>) {
    setRowState((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] ?? { pending: false, error: null }), ...state },
    }));
  }

  async function handleToggle(entry: PoolEntry) {
    const templateId = entry.templateId;
    setRow(templateId, { pending: true, error: null });
    try {
      const result = await updatePoolEntry(templateId, { isEnabled: !entry.isEnabled });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        setRow(templateId, { error: "Failed to update. Please try again." });
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.templateId === templateId ? result.data : e))
      );
    } finally {
      setRow(templateId, { pending: false });
    }
  }

  async function handleWeightSave(entry: PoolEntry) {
    const templateId = entry.templateId;
    const draft = weightDraft[templateId];
    if (draft === undefined) return;

    const parsed = draft === "" ? null : Number(draft);
    if (draft !== "" && (isNaN(parsed as number) || (parsed as number) < 0)) {
      setRow(templateId, { error: "Weight must be a non-negative number." });
      return;
    }

    setRow(templateId, { pending: true, error: null });
    try {
      const result = await updatePoolEntry(templateId, { customWeight: parsed });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        setRow(templateId, { error: "Failed to save weight. Please try again." });
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.templateId === templateId ? result.data : e))
      );
      setWeightDraft((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    } finally {
      setRow(templateId, { pending: false });
    }
  }

  function handleWeightKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    entry: PoolEntry
  ) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No cards in pool.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const { pending, error } = getRow(entry.templateId);
        const draftValue = weightDraft[entry.templateId];
        const weightValue =
          draftValue !== undefined
            ? draftValue
            : entry.customWeight !== null
            ? String(entry.customWeight)
            : "";

        return (
          <div
            key={entry.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <RarityBadge rarity={entry.template.rarity} />

              <span className="flex-1 font-medium text-white min-w-0 truncate">
                {entry.template.name}
              </span>

              <span className="shrink-0 text-xs text-zinc-500">
                Base weight: {entry.template.dropWeight}
              </span>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs text-zinc-400">Custom weight</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={String(entry.template.dropWeight)}
                  value={weightValue}
                  disabled={pending}
                  className="w-24 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none disabled:opacity-50"
                  onChange={(e) =>
                    setWeightDraft((prev) => ({
                      ...prev,
                      [entry.templateId]: e.target.value,
                    }))
                  }
                  onBlur={() => handleWeightSave(entry)}
                  onKeyDown={(e) => handleWeightKeyDown(e, entry)}
                />
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <span className="text-xs text-zinc-400">
                  {entry.isEnabled ? "Enabled" : "Disabled"}
                </span>
                <button
                  role="switch"
                  aria-checked={entry.isEnabled}
                  disabled={pending}
                  onClick={() => handleToggle(entry)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                    entry.isEnabled ? "bg-green-600" : "bg-zinc-600"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      entry.isEnabled ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>

              {pending && (
                <span className="shrink-0 text-xs text-zinc-500">Saving…</span>
              )}
            </div>

            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
