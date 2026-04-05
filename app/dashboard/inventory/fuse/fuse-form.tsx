"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fuseCards } from "@/app/actions/fusion";
import type { CardRarity, UserCard, FuseResponse } from "@/app/types/cards";

interface FuseFormProps {
  cards: UserCard[];
}

const RARITY_BADGE: Record<CardRarity, string> = {
  common: "bg-zinc-700 text-zinc-300",
  uncommon: "bg-green-900 text-green-300",
  rare: "bg-blue-900 text-blue-300",
  epic: "bg-purple-900 text-purple-300",
  legendary: "bg-amber-900 text-amber-300",
};

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "You don't own one of these cards",
  invalid_fusion: "Invalid fusion. Cards must be the same type, active, and 1-5 materials.",
  conflict: "One of these cards is already in use",
  not_found: "Card not found",
  server_error: "Something went wrong. Please try again.",
};

export function FuseForm({ cards }: FuseFormProps) {
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [materialIds, setMaterialIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<FuseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const target = cards.find((c) => c.id === targetId) ?? null;

  const eligibleMaterials = target
    ? cards.filter((c) => c.id !== targetId && c.templateId === target.templateId)
    : [];

  function handleSelectTarget(card: UserCard) {
    setTargetId(card.id);
    setMaterialIds(new Set());
    setResult(null);
    setError(null);
  }

  function toggleMaterial(id: string) {
    setMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return next;
    });
  }

  function handleReset() {
    setTargetId(null);
    setMaterialIds(new Set());
    setResult(null);
    setError(null);
  }

  function handleFuse() {
    if (!targetId || materialIds.size === 0) return;

    startTransition(async () => {
      setError(null);
      setResult(null);
      const res = await fuseCards({
        targetCardId: targetId,
        materialCardIds: Array.from(materialIds),
      });
      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error);
        return;
      }
      setResult(res.data);
      setMaterialIds(new Set());
    });
  }

  const canFuse = targetId !== null && materialIds.size >= 1 && !isPending;

  // ── Step 1: No target selected ───────────────────────────────────────────

  if (!target) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Step 1 — Select Target Card
        </h2>
        {cards.length === 0 && (
          <p className="text-sm text-zinc-500">No active cards in your collection.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleSelectTarget(card)}
              className="group flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
            >
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
                <span className="absolute left-1.5 top-1.5 rounded bg-zinc-950/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                  Lv. {card.level}
                </span>
                <span
                  className={`absolute bottom-1.5 right-1.5 rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                    RARITY_BADGE[card.template.rarity as CardRarity] ?? "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {card.template.rarity}
                </span>
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium text-white">{card.template.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-800 bg-green-950/40 p-6 text-center space-y-3">
          <p className="text-lg font-semibold text-green-300">Fusion successful!</p>
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-white">{result.fusion.xpGained} XP</span> transferred to{" "}
            <span className="font-medium text-white">{result.targetCard.template.name}</span>
          </p>
          <p className="text-sm text-zinc-400">
            New level: <span className="font-medium text-white">{result.targetCard.level}</span>
          </p>
        </div>
        <button
          onClick={handleReset}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Fuse More Cards
        </button>
      </div>
    );
  }

  // ── Step 2: Target selected, pick materials ──────────────────────────────

  return (
    <div className="space-y-6">
      {/* Selected target */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Target Card
          </h2>
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Change
          </button>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-900 p-3">
          {target.template.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={target.template.imageUrl}
              alt={target.template.name}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded bg-zinc-800" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">{target.template.name}</p>
            <p className="text-xs text-zinc-400">
              Level {target.level} &middot;{" "}
              <span className="capitalize">{target.template.rarity}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Material selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Step 2 — Select Materials ({materialIds.size}/5)
        </h2>
        {eligibleMaterials.length === 0 && (
          <p className="text-sm text-zinc-500">
            No other cards of the same type available as materials.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {eligibleMaterials.map((card) => {
            const selected = materialIds.has(card.id);
            const atLimit = materialIds.size >= 5 && !selected;
            return (
              <button
                key={card.id}
                onClick={() => toggleMaterial(card.id)}
                disabled={atLimit}
                className={`group flex flex-col overflow-hidden rounded-lg border transition-colors disabled:opacity-40 ${
                  selected
                    ? "border-violet-500 bg-violet-950/40"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800"
                }`}
              >
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
                  <span className="absolute left-1.5 top-1.5 rounded bg-zinc-950/80 px-1.5 py-0.5 text-xs font-semibold text-white">
                    Lv. {card.level}
                  </span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-violet-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                      Selected
                    </span>
                  )}
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-white">{card.template.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Fuse button */}
      <button
        onClick={handleFuse}
        disabled={!canFuse}
        className="w-full rounded-md bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending
          ? "Fusing…"
          : `Fuse with ${materialIds.size} material${materialIds.size !== 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
