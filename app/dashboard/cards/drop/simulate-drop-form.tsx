"use client";

import { useState } from "react";
import { simulateDrop } from "@/app/actions/cards";
import type { SimulateDropResponse, SubscriptionTier } from "@/app/types/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RARITY_CONFIG } from "@/lib/rarity";

const TIERS: { value: SubscriptionTier; label: string }[] = [
  { value: "1000", label: "Tier 1" },
  { value: "2000", label: "Tier 2" },
  { value: "3000", label: "Tier 3" },
];

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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="userId">User ID (UUID)</Label>
          <Input
            id="userId"
            type="text"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="550e8400-e29b-41d4-a716-446655440000"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tier">Tier de suscripción</Label>
          <Select
            value={tier}
            onValueChange={(v) => setTier(v as SubscriptionTier)}
          >
            <SelectTrigger id="tier" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading || !userId.trim()}
        >
          {loading ? "Simulando..." : "Simular Drop"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Carta dropeada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Nombre:{" "}
              <span className="text-foreground font-medium">{result.template_name}</span>
            </p>
            <p className="text-muted-foreground">
              Rareza:{" "}
              <span className={`font-medium capitalize ${RARITY_CONFIG[result.rarity]?.text ?? "text-foreground"}`}>
                {result.rarity}
              </span>
            </p>
            <div className="flex gap-4 pt-1">
              <span className="text-red-400">ATK {result.attack}</span>
              <span className="text-blue-400">DEF {result.defense}</span>
              <span className="text-green-400">AGI {result.agility}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Card ID: {result.user_card_id}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
