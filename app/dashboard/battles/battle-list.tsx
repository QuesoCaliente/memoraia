"use client";

import { useEffect, useState } from "react";
import { resolveBattle } from "@/app/actions/battles";
import type { Battle, ResolvedBattle } from "@/app/types/cards";
import { CreateBattleForm } from "./create-battle-form";

interface BattleListProps {
  initialBattles: Battle[];
  total: number;
}

interface FinishedBattle extends Battle {
  xpGained?: number;
}

export function BattleList({ initialBattles, total }: BattleListProps) {
  const [pending, setPending] = useState<Battle[]>(
    initialBattles.filter((b) => b.status === "pending")
  );
  const [finished, setFinished] = useState<FinishedBattle[]>(
    initialBattles.filter((b) => b.status === "finished")
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  function handleCreated(battle: Battle) {
    setPending((prev) => [battle, ...prev]);
    setShowCreateForm(false);
  }

  async function handleResolve(battle: Battle, winnerCardId: string) {
    setResolvingId(battle.id);
    setError(null);
    try {
      const result = await resolveBattle(battle.id, { winnerCardId });
      if (!result.ok) {
        setError(mapResolveError(result.error));
        return;
      }
      const resolved: ResolvedBattle = result.data;
      setPending((prev) => prev.filter((b) => b.id !== battle.id));
      setFinished((prev) => [
        {
          ...battle,
          status: "finished" as const,
          xpGained: resolved.xpGained,
        },
        ...prev,
      ]);
    } finally {
      setResolvingId(null);
    }
  }

  const totalCount = pending.length + finished.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {pending.length} pending · {totalCount} total
        </p>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          {showCreateForm ? "Cancel" : "+ New Battle"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-950 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-base font-semibold text-white">New Battle</h2>
          <CreateBattleForm
            onSave={handleCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Pending section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Pending ({pending.length})
        </h2>

        {pending.length === 0 && (
          <p className="text-sm text-zinc-600">No pending battles.</p>
        )}

        {pending.map((battle) => (
          <div
            key={battle.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-white">
                  <span className="font-medium text-purple-400">Challenger</span>{" "}
                  <span className="font-mono text-xs text-zinc-300">{battle.challengerCardId}</span>
                  {" "}<span className="text-zinc-500">vs</span>{" "}
                  <span className="font-medium text-blue-400">Defender</span>{" "}
                  <span className="font-mono text-xs text-zinc-300">{battle.defenderCardId}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(battle.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleResolve(battle, battle.challengerCardId)}
                  disabled={resolvingId === battle.id}
                  className="rounded-md bg-purple-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
                >
                  {resolvingId === battle.id ? "..." : "Challenger Wins"}
                </button>
                <button
                  onClick={() => handleResolve(battle, battle.defenderCardId)}
                  disabled={resolvingId === battle.id}
                  className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  {resolvingId === battle.id ? "..." : "Defender Wins"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Finished section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Finished ({finished.length})
        </h2>

        {finished.length === 0 && (
          <p className="text-sm text-zinc-600">No finished battles.</p>
        )}

        {finished.map((battle) => (
          <div
            key={battle.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 opacity-75"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <p className="truncate font-mono text-xs text-zinc-400">{battle.id}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(battle.createdAt).toLocaleString()}
                  {battle.xpGained !== undefined && (
                    <span className="ml-2 text-green-400">+{battle.xpGained} XP</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-green-900 px-2 py-0.5 text-xs font-medium text-green-300">
                finished
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function mapResolveError(error: string): string {
  switch (error) {
    case "forbidden":
      return "Streamer permissions required";
    case "not_found":
      return "Battle or card not found";
    case "server_error":
    default:
      return "Something went wrong";
  }
}
