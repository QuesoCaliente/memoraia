"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fuseCards } from "@/app/actions/fusion";
import type { CardRarity, UserCard } from "@/app/types/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Layers, ImageOff } from "lucide-react";
import { RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface FuseFormProps {
  cards: UserCard[];
}

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "No sos el dueño de una de estas cartas.",
  invalid_fusion: "Fusión inválida. Las cartas deben ser del mismo tipo, activas y entre 1 y 5 materiales.",
  conflict: "Una de estas cartas ya está en uso.",
  not_found: "Carta no encontrada.",
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

function CardImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
      <ImageOff aria-hidden="true" className="h-6 w-6" />
    </div>
  );
}

export function FuseForm({ cards }: FuseFormProps) {
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [materialIds, setMaterialIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const target = cards.find((c) => c.id === targetId) ?? null;

  const eligibleMaterials = target
    ? cards.filter((c) => c.id !== targetId && c.templateId === target.templateId)
    : [];

  function handleSelectTarget(card: UserCard) {
    setTargetId(card.id);
    setMaterialIds(new Set());
  }

  function toggleMaterial(id: string) {
    setMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return next;
    });
  }

  function handleReset() {
    setTargetId(null);
    setMaterialIds(new Set());
  }

  function handleFuse() {
    if (!targetId || materialIds.size === 0) return;

    startTransition(async () => {
      const res = await fuseCards({
        targetCardId: targetId,
        materialCardIds: Array.from(materialIds),
      });

      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        toast.error(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error);
        return;
      }

      toast.success(
        `¡Fusión exitosa! Obtuviste ${res.data.fusion.xpGained} XP para ${res.data.targetCard.template.name}`
      );
      setMaterialIds(new Set());
      setTargetId(null);
    });
  }

  const canFuse = targetId !== null && materialIds.size >= 1 && !isPending;

  // ── Step 1: No target selected ───────────────────────────────────────────

  if (!target) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Paso 1 — Seleccioná la carta objetivo
        </h2>

        {cards.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Layers aria-hidden="true" className="h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-semibold text-foreground">
              No hay cartas disponibles para fusionar
            </h3>
            <p className="text-xs text-muted-foreground">
              Necesitás al menos una carta activa en tu colección.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleSelectTarget(card)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/50 hover:bg-card/80"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                {card.template.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.template.imageUrl}
                    alt={card.template.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <CardImagePlaceholder />
                )}
                <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-foreground">
                  Nv. {card.level}
                </span>
                <span
                  className={cn(
                    "absolute bottom-1.5 right-1.5 rounded border px-1.5 py-0.5 text-xs font-medium capitalize",
                    RARITY_CONFIG[card.template.rarity as CardRarity]?.bg ?? "bg-muted",
                    RARITY_CONFIG[card.template.rarity as CardRarity]?.text ?? "text-muted-foreground",
                    RARITY_CONFIG[card.template.rarity as CardRarity]?.border ?? "border-border"
                  )}
                >
                  {card.template.rarity}
                </span>
              </div>
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium text-foreground">{card.template.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: Target selected, pick materials ──────────────────────────────

  return (
    <div className="space-y-6">
      {/* Selected target */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Carta objetivo
          </h2>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Cambiar
          </Button>
        </div>
        <Card size="sm">
          <CardContent className="flex items-center gap-4 py-3">
            {target.template.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={target.template.imageUrl}
                alt={target.template.name}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {target.template.name}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Nivel {target.level}</span>
                <RarityBadge rarity={target.template.rarity as CardRarity} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Paso 2 — Seleccioná los materiales ({materialIds.size}/5)
        </h2>

        {eligibleMaterials.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay otras cartas del mismo tipo disponibles como material.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {eligibleMaterials.map((card) => {
            const selected = materialIds.has(card.id);
            const atLimit = materialIds.size >= 5 && !selected;
            return (
              <button
                key={card.id}
                onClick={() => toggleMaterial(card.id)}
                disabled={atLimit}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-xl border transition-all duration-200 disabled:opacity-40",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-border/70 hover:bg-card/80"
                )}
              >
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  {card.template.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.template.imageUrl}
                      alt={card.template.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <CardImagePlaceholder />
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-foreground">
                    Nv. {card.level}
                  </span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
                      Seleccionada
                    </span>
                  )}
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium text-foreground">{card.template.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fuse button */}
      <Button
        onClick={handleFuse}
        disabled={!canFuse}
        aria-busy={isPending}
        className="w-full"
        size="lg"
      >
        {isPending
          ? "Fusionando…"
          : `Fusionar con ${materialIds.size} material${materialIds.size !== 1 ? "es" : ""}`}
      </Button>
    </div>
  );
}
