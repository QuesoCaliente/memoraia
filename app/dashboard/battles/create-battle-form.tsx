"use client";

import { useState } from "react";
import { createBattle } from "@/app/actions/battles";
import type { Battle } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlertIcon } from "lucide-react";

interface CreateBattleFormProps {
  onSave: (battle: Battle) => void;
  onCancel: () => void;
}

function mapErrorMessage(error: string): string {
  switch (error) {
    case "forbidden":
      return "Streamer permissions required";
    case "bad_request":
      return "Challenger and defender must be different cards";
    case "unprocessable":
      return "Cards must be active, belong to different users, and not be yours";
    case "not_found":
      return "Card not found";
    case "server_error":
    default:
      return "Something went wrong";
  }
}

export function CreateBattleForm({ onSave, onCancel }: CreateBattleFormProps) {
  const [challengerCardId, setChallengerCardId] = useState("");
  const [defenderCardId, setDefenderCardId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const result = await createBattle({
        challengerCardId,
        defenderCardId,
        ...(streamId.trim() ? { streamId: streamId.trim() } : {}),
      });
      if (!result.ok) {
        setError(mapErrorMessage(result.error));
        return;
      }
      onSave(result.data);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="challengerCardId">
          Challenger Card ID <span className="text-destructive">*</span>
        </Label>
        <Input
          id="challengerCardId"
          type="text"
          required
          disabled={isPending}
          value={challengerCardId}
          onChange={(e) => setChallengerCardId(e.target.value)}
          placeholder="Enter challenger card ID"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="defenderCardId">
          Defender Card ID <span className="text-destructive">*</span>
        </Label>
        <Input
          id="defenderCardId"
          type="text"
          required
          disabled={isPending}
          value={defenderCardId}
          onChange={(e) => setDefenderCardId(e.target.value)}
          placeholder="Enter defender card ID"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="streamId">
          Stream ID{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="streamId"
          type="text"
          disabled={isPending}
          value={streamId}
          onChange={(e) => setStreamId(e.target.value)}
          placeholder="Enter stream ID"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Battle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
