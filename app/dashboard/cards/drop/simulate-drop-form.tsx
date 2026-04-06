"use client";

import { useState } from "react";
import { simulateDrop } from "@/app/actions/cards";
import type { SimulateDropResponse, SubscriptionTier } from "@/app/types/cards";

const TIERS: { value: SubscriptionTier; label: string }[] = [
  { value: "1000", label: "Tier 1" },
  { value: "2000", label: "Tier 2" },
  { value: "3000", label: "Tier 3" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "text-zinc-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

export function SimulateDropForm() {
  const [userId, setUserId] = useState("");
  const [tier, setTier] = useState<SubscriptionTier>("1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulateDropResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const res = await simulateDrop({ userId, tier });

    if (res.ok) {
      setResult(res.data);
    } else {
      const messages: Record<string, string> = {
        unauthorized: "Sesión expirada. Volvé a iniciar sesión.",
        forbidden: "Se requiere admin + streamer habilitado.",
        user_not_found: "Usuario no encontrado.",
        empty_pool: "No hay templates en el pool. Agregá cartas primero.",
        server_error: "Error del servidor. Intentá de nuevo.",
      };
      setError(messages[res.error] ?? messages.server_error);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="userId" className="text-sm text-zinc-400">
            User ID (UUID)
          </label>
          <input
            id="userId"
            type="text"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="550e8400-e29b-41d4-a716-446655440000"
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-purple-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tier" className="text-sm text-zinc-400">
            Tier de suscripción
          </label>
          <select
            id="tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as SubscriptionTier)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-purple-500"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !userId.trim()}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Simulando..." : "Simular Drop"}
        </button>
      </form>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-md border border-zinc-700 bg-zinc-800 p-4 space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Carta dropeada</h3>
          <div className="space-y-1 text-sm">
            <p className="text-zinc-400">
              Nombre:{" "}
              <span className="text-white font-medium">{result.template_name}</span>
            </p>
            <p className="text-zinc-400">
              Rareza:{" "}
              <span className={`font-medium capitalize ${RARITY_COLORS[result.rarity] ?? "text-white"}`}>
                {result.rarity}
              </span>
            </p>
            <div className="flex gap-4 pt-1">
              <span className="text-red-400">ATK {result.attack}</span>
              <span className="text-blue-400">DEF {result.defense}</span>
              <span className="text-green-400">AGI {result.agility}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Card ID: {result.user_card_id}
          </p>
        </div>
      )}
    </div>
  );
}
