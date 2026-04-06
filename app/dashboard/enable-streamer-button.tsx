"use client";

import { useState } from "react";
import { enableStreamer } from "@/app/actions/auth";

export function EnableStreamerButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const result = await enableStreamer();
      if (result.ok) {
        window.location.href = "/api/auth/relogin";
      } else if (result.error === "unauthorized") {
        window.location.href = "/";
      } else {
        setError("No se pudo activar. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Modo Streamer</h2>
      <p className="text-sm text-zinc-400">
        Activá el modo streamer para crear cartas, gestionar tu overlay, configurar
        batallas y más.
      </p>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="self-start rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Activando..." : "Activar modo streamer"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
