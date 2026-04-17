"use client";

import { useState } from "react";
import { enableStreamer } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Monitor, Swords, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  { icon: Palette, text: "Crear y gestionar cartas personalizadas" },
  { icon: Monitor, text: "Overlay en vivo para OBS" },
  { icon: Swords, text: "Batallas entre viewers en stream" },
];

export function EnableStreamerButton() {
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      const result = await enableStreamer();
      if (result.ok) {
        globalThis.location.href = "/api/auth/relogin";
      } else if (result.error === "unauthorized") {
        globalThis.location.href = "/";
      } else {
        toast.error("No se pudo activar. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">Modo Streamer</CardTitle>
        <CardDescription>
          Desbloquea herramientas exclusivas para tu canal de Twitch
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="space-y-2.5">
          {FEATURES.map((feature) => (
            <li key={feature.text} className="flex items-center gap-3 text-sm text-muted-foreground">
              <feature.icon className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
              {feature.text}
            </li>
          ))}
        </ul>
        <Button
          onClick={handleEnable}
          disabled={loading}
          aria-busy={loading}
          size="lg"
          className="mt-2 self-start"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Activando…
            </>
          ) : (
            "Activar modo streamer"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
