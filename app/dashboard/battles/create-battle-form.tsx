"use client";

import { useState } from "react";
import { createBattle } from "@/app/actions/battles";
import type { Battle } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateBattleFormProps {
  onSave: (battle: Battle) => void;
  onCancel: () => void;
}

function mapErrorMessage(error: string): string {
  switch (error) {
    case "forbidden":
      return "Se requieren permisos de streamer";
    case "bad_request":
      return "El retador y el defensor deben ser cartas distintas";
    case "unprocessable":
      return "Las cartas deben estar activas, pertenecer a usuarios distintos y no ser tuyas";
    case "not_found":
      return "Carta no encontrada";
    case "server_error":
    default:
      return "Algo salió mal";
  }
}

export function CreateBattleForm({ onSave, onCancel }: CreateBattleFormProps) {
  const [challengerCardId, setChallengerCardId] = useState("");
  const [defenderCardId, setDefenderCardId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      const result = await createBattle({
        challengerCardId,
        defenderCardId,
        ...(streamId.trim() ? { streamId: streamId.trim() } : {}),
      });
      if (!result.ok) {
        toast.error(mapErrorMessage(result.error));
        return;
      }
      onSave(result.data);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="challengerCardId">
          ID de carta retadora <span className="text-destructive">*</span>
        </Label>
        <Input
          id="challengerCardId"
          type="text"
          required
          disabled={isPending}
          value={challengerCardId}
          onChange={(e) => setChallengerCardId(e.target.value)}
          placeholder="Ingresá el ID de la carta retadora"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defenderCardId">
          ID de carta defensora <span className="text-destructive">*</span>
        </Label>
        <Input
          id="defenderCardId"
          type="text"
          required
          disabled={isPending}
          value={defenderCardId}
          onChange={(e) => setDefenderCardId(e.target.value)}
          placeholder="Ingresá el ID de la carta defensora"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="streamId">
          ID de stream{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="streamId"
          type="text"
          disabled={isPending}
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
          placeholder="Ingresá el ID del stream"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="transition-all duration-200"
        >
          {isPending ? "Creando…" : "Crear Batalla"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
          className="transition-all duration-200"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
