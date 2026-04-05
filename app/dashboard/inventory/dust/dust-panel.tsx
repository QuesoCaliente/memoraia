"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { destroyCardForDust } from "@/app/actions/fusion";
import type { CardRarity, DustTransaction, UserCard } from "@/app/types/cards";

interface DustPanelProps {
  initialBalance: number;
  initialHistory: DustTransaction[];
  historyTotal: number;
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
  forbidden: "You don't own this card",
  undestroyable: "This card cannot be destroyed (inactive or legendary).",
  not_found: "Card not found",
  conflict: "This card is currently in use",
  server_error: "Something went wrong. Please try again.",
};

export function DustPanel({
  initialBalance,
  initialHistory,
  historyTotal,
  cards,
}: DustPanelProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState<DustTransaction[]>(initialHistory);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [destroyResult, setDestroyResult] = useState<{
    dustGained: number;
    cardName: string;
  } | null>(null);
  const [destroyError, setDestroyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  function handleDestroy() {
    if (!selectedCardId) return;

    startTransition(async () => {
      setDestroyError(null);
      setDestroyResult(null);
      const res = await destroyCardForDust(selectedCardId);
      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        const msg =
          res.error === "invalid_fusion"
            ? ERROR_MESSAGES.undestroyable
            : (ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error);
        setDestroyError(msg);
        return;
      }
      const cardName = selectedCard?.template.name ?? "Card";
      setBalance(res.data.newBalance);
      setHistory((prev) => [res.data.transaction, ...prev]);
      setDestroyResult({ dustGained: res.data.dustGained, cardName });
      setSelectedCardId(null);
    });
  }

  return (
    <div className="space-y-8">
      {/* ── Balance ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Dust Balance
        </p>
        <p className="mt-2 text-5xl font-bold text-amber-400">{balance.toLocaleString()}</p>
      </div>

      {/* ── Destroy section ─────────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-base font-semibold text-white">Destroy Card for Dust</h2>

        {destroyResult && (
          <div className="rounded-md border border-green-800 bg-green-950/40 px-4 py-3 text-sm text-green-300">
            <span className="font-medium">{destroyResult.cardName}</span> destroyed for{" "}
            <span className="font-medium">{destroyResult.dustGained} dust</span>.
          </div>
        )}

        {destroyError && (
          <div className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {destroyError}
          </div>
        )}

        {/* Card selector */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Select a card to destroy
          </label>
          <select
            value={selectedCardId ?? ""}
            onChange={(e) => {
              setSelectedCardId(e.target.value || null);
              setDestroyError(null);
              setDestroyResult(null);
            }}
            disabled={isPending}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">— Choose a card —</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.template.name} ({card.template.rarity}) — Lv. {card.level}
              </option>
            ))}
          </select>
        </div>

        {/* Selected card preview */}
        {selectedCard && (
          <div className="flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800 p-3">
            {selectedCard.template.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedCard.template.imageUrl}
                alt={selectedCard.template.name}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-zinc-700" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {selectedCard.template.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                    RARITY_BADGE[selectedCard.template.rarity as CardRarity] ??
                    "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {selectedCard.template.rarity}
                </span>
                <span className="text-xs text-zinc-400">Level {selectedCard.level}</span>
              </div>
            </div>
          </div>
        )}

        {selectedCard && (
          <p className="text-xs text-zinc-500">
            This will permanently destroy the card.
          </p>
        )}

        <button
          onClick={handleDestroy}
          disabled={!selectedCardId || isPending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Destroying…" : "Destroy"}
        </button>
      </div>

      {/* ── Craft placeholder ────────────────────────────────────────── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-base font-semibold text-white">Craft Cards</h2>
        <p className="mt-2 text-sm text-zinc-500">Craft cards coming soon.</p>
      </div>

      {/* ── History section ──────────────────────────────────────────── */}
      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Transaction History</h2>
          <span className="text-xs text-zinc-500">{historyTotal} total</span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="pb-2 pr-4 text-xs font-medium text-zinc-400">Date</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-zinc-400">Reason</th>
                  <th className="pb-2 pr-4 text-right text-xs font-medium text-zinc-400">
                    Amount
                  </th>
                  <th className="pb-2 text-right text-xs font-medium text-zinc-400">
                    Balance After
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="py-2 pr-4 text-xs text-zinc-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-xs capitalize text-zinc-300">
                      {tx.reason.replace(/_/g, " ")}
                    </td>
                    <td
                      className={`py-2 pr-4 text-right text-xs font-medium tabular-nums ${
                        tx.amount >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount}
                    </td>
                    <td className="py-2 text-right text-xs text-zinc-300 tabular-nums">
                      {tx.balanceAfter.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
