"use client";

import { useState } from "react";
import { regenerateOverlayKey, testOverlayRedemption } from "@/app/actions/overlay";

interface OverlayPanelProps {
  initialKey: string;
  initialUrl: string;
}

export function OverlayPanel({ initialKey, initialUrl }: OverlayPanelProps) {
  const [overlayKey, setOverlayKey] = useState(initialKey);
  const [overlayUrl, setOverlayUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function copyUrl() {
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerateKey() {
    setRegenerating(true);
    try {
      const result = await regenerateOverlayKey();
      if (result.ok) {
        setOverlayKey(result.data.overlayKey);
        setOverlayUrl(result.data.overlayUrl);
      } else if (result.error === "unauthorized") {
        window.location.href = "/";
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function testRedemption() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testOverlayRedemption();
      if (result.ok) {
        setTestResult(
          result.data.connections > 0
            ? `Evento enviado a ${result.data.connections} overlay(s) activo(s)`
            : "No hay overlays escuchando. Abrí la URL del overlay primero.",
        );
      } else if (result.error === "unauthorized") {
        window.location.href = "/";
      } else {
        setTestResult("Error al enviar evento de test");
      }
    } finally {
      setTesting(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-lg font-semibold text-white">Overlay</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">URL del overlay (para OBS)</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={overlayUrl}
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none"
          />
          <button
            onClick={copyUrl}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-zinc-400">Overlay Key</label>
        <code className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
          {overlayKey}
        </code>
      </div>

      <div className="flex gap-3">
        <button
          onClick={testRedemption}
          disabled={testing}
          className="self-start rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {testing ? "Enviando..." : "Probar Redemption"}
        </button>

        <button
          onClick={regenerateKey}
          disabled={regenerating}
          className="self-start rounded-md border border-red-800 bg-transparent px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-950 disabled:opacity-50"
        >
          {regenerating ? "Regenerando..." : "Regenerar Key"}
        </button>
      </div>

      {testResult && (
        <p className="text-sm text-zinc-400">{testResult}</p>
      )}

      <p className="text-xs text-zinc-500">
        Regenerar invalida la key anterior. Las conexiones activas seguirán
        funcionando hasta que se desconecten.
      </p>
    </div>
  );
}
