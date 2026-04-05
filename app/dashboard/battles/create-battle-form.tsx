"use client";

import { useState } from "react";
import { createBattle } from "@/app/actions/battles";
import type { Battle } from "@/app/types/cards";

interface CreateBattleFormProps {
  onSave: (battle: Battle) => void;
  onCancel: () => void;
}

function mapErrorMessage(error: string): string {
  switch (error) {
    case "forbidden":
      return "Streamer permissions required";
    case "bad_request":
      return "Challenger and defender must be different cards";
    case "unprocessable":
      return "Cards must be active, belong to different users, and not be yours";
    case "not_found":
      return "Card not found";
    case "server_error":
    default:
      return "Something went wrong";
  }
}

export function CreateBattleForm({ onSave, onCancel }: CreateBattleFormProps) {
  const [challengerCardId, setChallengerCardId] = useState("");
  const [defenderCardId, setDefenderCardId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const result = await createBattle({
        challengerCardId,
        defenderCardId,
        ...(streamId.trim() ? { streamId: streamId.trim() } : {}),
      });
      if (!result.ok) {
        setError(mapErrorMessage(result.error));
        return;
      }
      onSave(result.data);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="challengerCardId" className="text-xs font-medium text-zinc-400">
          Challenger Card ID <span className="text-red-400">*</span>
        </label>
        <input
          id="challengerCardId"
          type="text"
          required
          disabled={isPending}
          value={challengerCardId}
          onChange={(e) => setChallengerCardId(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          placeholder="Enter challenger card ID"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="defenderCardId" className="text-xs font-medium text-zinc-400">
          Defender Card ID <span className="text-red-400">*</span>
        </label>
        <input
          id="defenderCardId"
          type="text"
          required
          disabled={isPending}
          value={defenderCardId}
          onChange={(e) => setDefenderCardId(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          placeholder="Enter defender card ID"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="streamId" className="text-xs font-medium text-zinc-400">
          Stream ID <span className="text-zinc-600">(optional)</span>
        </label>
        <input
          id="streamId"
          type="text"
          disabled={isPending}
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          placeholder="Enter stream ID"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Battle"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onCancel}
          className="rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
