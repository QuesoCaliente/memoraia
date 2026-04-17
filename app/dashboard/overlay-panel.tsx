"use client";

import { useState } from "react";
import { regenerateOverlayKey, testOverlayRedemption } from "@/app/actions/overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, RefreshCw, Zap } from "lucide-react";

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

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const result = await regenerateOverlayKey();
      if (result.ok) {
        setOverlayKey(result.data.overlayKey);
        setOverlayUrl(result.data.overlayUrl);
      } else if (result.error === "unauthorized") {
        window.location.href = "/";
      } else {
        setTestResult("Error al regenerar la key. Intentá de nuevo.");
        setTimeout(() => setTestResult(null), 5000);
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
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Overlay</h2>

      <div className="flex flex-col gap-2">
        <Label>URL del overlay (para OBS)</Label>
        <div className="flex gap-2">
          <Input readOnly value={overlayUrl} className="flex-1 font-mono text-xs" />
          <Button variant="secondary" size="icon" onClick={copyUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Overlay Key</Label>
        <code className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground font-mono">
          {overlayKey}
        </code>
      </div>

      <div className="flex gap-3">
        <Button onClick={testRedemption} disabled={testing}>
          <Zap className="mr-2 h-4 w-4" />
          {testing ? "Enviando..." : "Probar Redemption"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" disabled={regenerating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {regenerating ? "Regenerando..." : "Regenerar Key"}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Regenerar overlay key?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto invalidará la key anterior. Las conexiones activas seguirán
                funcionando hasta que se desconecten.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRegenerate}>
                Regenerar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {testResult && (
        <Alert>
          <AlertDescription>{testResult}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
