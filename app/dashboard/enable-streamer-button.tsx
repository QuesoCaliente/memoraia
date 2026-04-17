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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Modo Streamer
        </CardTitle>
        <CardDescription>
          Activá el modo streamer para crear cartas, gestionar tu overlay,
          configurar batallas y más.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button onClick={handleEnable} disabled={loading} className="self-start">
          {loading ? "Activando..." : "Activar modo streamer"}
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
