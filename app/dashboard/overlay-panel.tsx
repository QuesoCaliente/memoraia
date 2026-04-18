"use client";

import { useState } from "react";
import { regenerateOverlayKey, testOverlayRedemption } from "@/app/actions/overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Check, RefreshCw, Zap, Monitor } from "lucide-react";
import { toast } from "sonner";

interface OverlayPanelProps {
  initialKey: string;
}

function buildOverlayUrl(key: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/overlay/${key}`;
}

export function OverlayPanel({ initialKey }: OverlayPanelProps) {
  const [overlayKey, setOverlayKey] = useState(initialKey);
  const [overlayUrl, setOverlayUrl] = useState(() => buildOverlayUrl(initialKey));
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [testing, setTesting] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    toast.success("URL copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const result = await regenerateOverlayKey();
      if (result.ok) {
        setOverlayKey(result.data.overlayKey);
        setOverlayUrl(buildOverlayUrl(result.data.overlayKey));
        toast.success("Key regenerada exitosamente");
      } else if (result.error === "unauthorized") {
        globalThis.location.href = "/";
      } else {
        toast.error("Error al regenerar la key. Intentá de nuevo.");
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function testRedemption() {
    setTesting(true);
    try {
      const result = await testOverlayRedemption();
      if (result.ok) {
        if (result.data.connections > 0) {
          toast.success(`Evento enviado a ${result.data.connections} overlay(s) activo(s)`);
        } else {
          toast.warning("No hay overlays escuchando. Abrí la URL del overlay primero.");
        }
      } else if (result.error === "unauthorized") {
        globalThis.location.href = "/";
      } else {
        toast.error("Error al enviar evento de test");
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Overlay</h2>
      </div>

      <Separator />

      {/* URL */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="overlay-url">URL del overlay (para OBS)</Label>
        <div className="flex gap-2">
          <Input
            id="overlay-url"
            readOnly
            value={overlayUrl}
            className="flex-1 font-mono text-xs"
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={copyUrl}
                  aria-label="Copiar URL"
                >
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              }
            />
            <TooltipContent>Copiar URL</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Key */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="overlay-key">Overlay Key</Label>
        <code
          id="overlay-key"
          className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground"
        >
          {overlayKey}
        </code>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={testRedemption}
          disabled={testing}
          aria-busy={testing}
        >
          <Zap className="h-4 w-4" aria-hidden="true" />
          {testing ? "Enviando…" : "Probar Redemption"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button variant="destructive" disabled={regenerating} aria-busy={regenerating}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {regenerating ? "Regenerando…" : "Regenerar Key"}
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
    </div>
  );
}
