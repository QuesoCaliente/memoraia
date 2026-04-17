"use client";

import { useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { User, TwitchReward } from "@/app/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface SettingsFormProps {
  user: User;
  rewards: TwitchReward[];
  affiliateRequired: boolean;
}

function mapFormError(error: string): string {
  switch (error) {
    case "conflict":
      return "Este slug ya está en uso. Elegí otro.";
    case "forbidden":
      return "Se requieren permisos de streamer.";
    case "unauthorized":
      return "Sesión expirada. Por favor, iniciá sesión nuevamente.";
    default:
      return "Algo salió mal. Intentá de nuevo.";
  }
}

export function SettingsForm({
  user,
  rewards,
  affiliateRequired,
}: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [streamerBio, setStreamerBio] = useState(user.streamerBio ?? "");
  const [streamerSlug, setStreamerSlug] = useState(user.streamerSlug ?? "");
  const [cardDropRewardId, setCardDropRewardId] = useState(
    user.cardDropRewardId ?? ""
  );

  const [isPending, setIsPending] = useState(false);

  const initial = {
    displayName: user.displayName,
    streamerBio: user.streamerBio ?? "",
    streamerSlug: user.streamerSlug ?? "",
    cardDropRewardId: user.cardDropRewardId ?? "",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: Record<string, string | null> = {};
    if (displayName !== initial.displayName) payload.displayName = displayName;
    if (streamerBio !== initial.streamerBio) payload.streamerBio = streamerBio;
    if (streamerSlug !== initial.streamerSlug)
      payload.streamerSlug = streamerSlug;
    if (cardDropRewardId !== initial.cardDropRewardId) {
      payload.cardDropRewardId = cardDropRewardId || null;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No hay cambios para guardar");
      return;
    }

    setIsPending(true);
    try {
      const result = await updateProfileAction(
        payload as Parameters<typeof updateProfileAction>[0]
      );
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        toast.error(mapFormError(result.error));
        return;
      }
      toast.success("Cambios guardados");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Nombre</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre de usuario"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="streamerBio">Biografía</Label>
            <Textarea
              id="streamerBio"
              value={streamerBio}
              onChange={(e) => setStreamerBio(e.target.value)}
              placeholder="Contale a los espectadores sobre vos"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="streamerSlug">Slug</Label>
            <Input
              id="streamerSlug"
              type="text"
              value={streamerSlug}
              onChange={(e) => setStreamerSlug(e.target.value)}
              placeholder="tu-slug-unico"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground">
            Recompensa de carta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliateRequired ? (
            <p className="text-sm text-muted-foreground">
              Las recompensas de puntos de canal requieren ser Afiliado o
              Partner de Twitch. Convertite en Afiliado para configurar una
              recompensa que active drops de cartas.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cardDropRewardId">Recompensa activadora</Label>
              <Select
                value={cardDropRewardId}
                onValueChange={(value) => setCardDropRewardId(value ?? "")}
                disabled={isPending}
              >
                <SelectTrigger id="cardDropRewardId" className="w-full">
                  <SelectValue placeholder="— Ninguna —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Ninguna —</SelectItem>
                  {rewards.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} ({r.cost} puntos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Cuando un espectador canjee esta recompensa, se activará un
                drop de carta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="transition-all duration-200"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
