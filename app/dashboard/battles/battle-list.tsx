"use client";

import { useState } from "react";
import { resolveBattle } from "@/app/actions/battles";
import type { Battle, ResolvedBattle } from "@/app/types/cards";
import { CreateBattleForm } from "./create-battle-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Swords, Clock } from "lucide-react";
import { toast } from "sonner";

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

  function handleCreated(battle: Battle) {
    setPending((prev) => [battle, ...prev]);
    setDialogOpen(false);
  }

  async function handleResolve(battle: Battle, winnerCardId: string) {
    setResolvingId(battle.id);
    try {
      const result = await resolveBattle(battle.id, { winnerCardId });
      if (!result.ok) {
        toast.error(mapResolveError(result.error));
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
      toast.success("Batalla resuelta");
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
          {pending.length} pendientes · {totalCount} total
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            + Nueva Batalla
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Batalla</DialogTitle>
            </DialogHeader>
            <CreateBattleForm
              onSave={handleCreated}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Pendientes ({pending.length})
        </h2>

        {pending.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <Swords className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Sin batallas pendientes</p>
              <p className="text-xs text-muted-foreground">Creá una nueva batalla para comenzar.</p>
            </div>
          </div>
        )}

        {pending.map((battle) => (
          <Card key={battle.id}>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium text-primary">Retador</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {battle.challengerCardId}
                    </span>{" "}
                    <span className="text-muted-foreground">vs</span>{" "}
                    <span className="font-medium text-primary">Defensor</span>{" "}
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
                    aria-busy={resolvingId === battle.id}
                    className="transition-all duration-200"
                  >
                    {resolvingId === battle.id ? "Resolviendo…" : "Gana Retador"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleResolve(battle, battle.defenderCardId)
                    }
                    disabled={resolvingId === battle.id}
                    aria-busy={resolvingId === battle.id}
                    className="transition-all duration-200"
                  >
                    {resolvingId === battle.id ? "Resolviendo…" : "Gana Defensor"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Finished section */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          Finalizadas ({finished.length})
        </h2>

        {finished.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <Clock className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Sin batallas finalizadas</p>
          </div>
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
                <Badge variant="secondary">finalizada</Badge>
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
      return "Se requieren permisos de streamer";
    case "not_found":
      return "Batalla o carta no encontrada";
    case "server_error":
    default:
      return "Algo salió mal";
  }
}
