"use client";

import { useEffect, useState } from "react";
import { resolveBattle } from "@/app/actions/battles";
import type { Battle, ResolvedBattle } from "@/app/types/cards";
import { CreateBattleForm } from "./create-battle-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BattleListProps {
  initialBattles: Battle[];
  total: number;
}

interface FinishedBattle extends Battle {
  xpGained?: number;
}

export function BattleList({ initialBattles, total }: BattleListProps) {
  const [pending, setPending] = useState<Battle[]>(
    initialBattles.filter((b) => b.status === "pending")
  );
  const [finished, setFinished] = useState<FinishedBattle[]>(
    initialBattles.filter((b) => b.status === "finished")
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  function handleCreated(battle: Battle) {
    setPending((prev) => [battle, ...prev]);
    setDialogOpen(false);
  }

  async function handleResolve(battle: Battle, winnerCardId: string) {
    setResolvingId(battle.id);
    setError(null);
    try {
      const result = await resolveBattle(battle.id, { winnerCardId });
      if (!result.ok) {
        setError(mapResolveError(result.error));
        return;
      }
      const resolved: ResolvedBattle = result.data;
      setPending((prev) => prev.filter((b) => b.id !== battle.id));
      setFinished((prev) => [
        {
          ...battle,
          status: "finished" as const,
          xpGained: resolved.xpGained,
        },
        ...prev,
      ]);
    } finally {
      setResolvingId(null);
    }
  }

  const totalCount = pending.length + finished.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pending.length} pending · {totalCount} total
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button />}
          >
            + New Battle
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Battle</DialogTitle>
            </DialogHeader>
            <CreateBattleForm
              onSave={handleCreated}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pending ({pending.length})
        </h2>

        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">No pending battles.</p>
        )}

        {pending.map((battle) => (
          <Card key={battle.id}>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium text-primary">Challenger</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {battle.challengerCardId}
                    </span>{" "}
                    <span className="text-muted-foreground">vs</span>{" "}
                    <span className="font-medium text-primary">Defender</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {battle.defenderCardId}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(battle.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleResolve(battle, battle.challengerCardId)
                    }
                    disabled={resolvingId === battle.id}
                  >
                    {resolvingId === battle.id ? "..." : "Challenger Wins"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleResolve(battle, battle.defenderCardId)
                    }
                    disabled={resolvingId === battle.id}
                  >
                    {resolvingId === battle.id ? "..." : "Defender Wins"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Finished section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Finished ({finished.length})
        </h2>

        {finished.length === 0 && (
          <p className="text-sm text-muted-foreground">No finished battles.</p>
        )}

        {finished.map((battle) => (
          <Card key={battle.id} className="opacity-75">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {battle.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(battle.createdAt).toLocaleString()}
                    {battle.xpGained !== undefined && (
                      <span className="ml-2 text-primary">
                        +{battle.xpGained} XP
                      </span>
                    )}
                  </p>
                </div>
                <Badge variant="secondary">finished</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function mapResolveError(error: string): string {
  switch (error) {
    case "forbidden":
      return "Streamer permissions required";
    case "not_found":
      return "Battle or card not found";
    case "server_error":
    default:
      return "Something went wrong";
  }
}
