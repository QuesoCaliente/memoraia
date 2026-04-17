"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { destroyCardForDust } from "@/app/actions/fusion";
import type { CardRarity, DustTransaction, UserCard } from "@/app/types/cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface DustPanelProps {
  initialBalance: number;
  initialHistory: DustTransaction[];
  historyTotal: number;
  cards: UserCard[];
}

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "No sos el dueño de esta carta.",
  undestroyable: "Esta carta no se puede destruir (inactiva o legendaria).",
  not_found: "Carta no encontrada.",
  conflict: "Esta carta está actualmente en uso.",
  server_error: "Algo salió mal. Por favor, intentá de nuevo.",
};

function RarityBadge({ rarity }: { rarity: CardRarity }) {
  const config = RARITY_CONFIG[rarity];
  return (
    <Badge
      variant="outline"
      className={cn("border capitalize", config.bg, config.text, config.border)}
    >
      {rarity}
    </Badge>
  );
}

export function DustPanel({
  initialBalance,
  initialHistory,
  historyTotal,
  cards,
}: DustPanelProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState<DustTransaction[]>(initialHistory);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCard = cards.find((c) => c.id === selectedCardId) ?? null;

  function handleDestroy() {
    if (!selectedCardId) return;

    startTransition(async () => {
      const res = await destroyCardForDust(selectedCardId);
      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        const msg =
          res.error === "invalid_fusion"
            ? ERROR_MESSAGES.undestroyable
            : (ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error);
        toast.error(msg);
        return;
      }

      const cardName = selectedCard?.template.name ?? "Carta";
      setBalance(res.data.newBalance);
      setHistory((prev) => [res.data.transaction, ...prev]);
      toast.success(`${cardName} destruida por ${res.data.dustGained} polvo`);
      setSelectedCardId(null);
    });
  }

  return (
    <div className="space-y-8">
      {/* ── Balance ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Saldo de polvo
          </p>
          <p className="mt-2 text-5xl font-bold text-primary">{balance.toLocaleString("es-AR")}</p>
        </CardContent>
      </Card>

      {/* ── Destroy section ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Destruir carta por polvo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Card selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">
              Seleccioná una carta para destruir
            </label>
            {cards.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tenés cartas disponibles para destruir.
              </p>
            ) : (
              <Select
                value={selectedCardId ?? ""}
                onValueChange={(value) => {
                  setSelectedCardId(value || null);
                }}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— Elegí una carta —" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.template.name} ({card.template.rarity}) — Nv. {card.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected card preview */}
          {selectedCard && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-3">
              {selectedCard.template.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedCard.template.imageUrl}
                  alt={selectedCard.template.name}
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedCard.template.name}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <RarityBadge rarity={selectedCard.template.rarity as CardRarity} />
                  <span className="text-xs text-muted-foreground">Nivel {selectedCard.level}</span>
                </div>
              </div>
            </div>
          )}

          {selectedCard && (
            <p className="text-xs text-muted-foreground">
              Esta acción destruirá la carta de forma permanente.
            </p>
          )}

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="destructive"
                  disabled={!selectedCardId || isPending}
                  aria-busy={isPending}
                >
                  {isPending ? "Destruyendo…" : "Destruir"}
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Destruir carta?</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedCard
                    ? `Esto destruirá permanentemente "${selectedCard.template.name}" y la convertirá en polvo. Esta acción no se puede deshacer.`
                    : "Esta acción no se puede deshacer."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={handleDestroy}
                >
                  Destruir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* ── Craft placeholder ────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">Próximamente: fabricación de cartas con polvo.</p>

      {/* ── History section ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historial de transacciones</CardTitle>
            <span className="text-xs text-muted-foreground">{historyTotal} en total</span>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Clock aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">Sin transacciones todavía</p>
              <p className="text-xs text-muted-foreground">
                Tus movimientos de polvo aparecerán acá.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs">Motivo</TableHead>
                  <TableHead className="text-right text-xs">Cantidad</TableHead>
                  <TableHead className="text-right text-xs">Saldo tras operación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell className="text-xs capitalize text-foreground/80">
                      {tx.reason.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-xs font-medium tabular-nums",
                        tx.amount >= 0 ? "text-primary" : "text-destructive"
                      )}
                    >
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount}
                    </TableCell>
                    <TableCell className="text-right text-xs text-foreground/80 tabular-nums">
                      {tx.balanceAfter.toLocaleString("es-AR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
