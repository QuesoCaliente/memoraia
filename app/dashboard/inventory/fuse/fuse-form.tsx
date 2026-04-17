"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fuseCards } from "@/app/actions/fusion";
import type { CardRarity, UserCard, FuseResponse } from "@/app/types/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface FuseFormProps {
  cards: UserCard[];
}

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: "You don't own one of these cards",
  invalid_fusion: "Invalid fusion. Cards must be the same type, active, and 1-5 materials.",
  conflict: "One of these cards is already in use",
  not_found: "Card not found",
  server_error: "Something went wrong. Please try again.",
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

export function FuseForm({ cards }: FuseFormProps) {
  const router = useRouter();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [materialIds, setMaterialIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<FuseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const target = cards.find((c) => c.id === targetId) ?? null;

  const eligibleMaterials = target
    ? cards.filter((c) => c.id !== targetId && c.templateId === target.templateId)
    : [];

  function handleSelectTarget(card: UserCard) {
    setTargetId(card.id);
    setMaterialIds(new Set());
    setResult(null);
    setError(null);
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
    setResult(null);
    setError(null);
  }

  function handleFuse() {
    if (!targetId || materialIds.size === 0) return;

    startTransition(async () => {
      setError(null);
      setResult(null);
      const res = await fuseCards({
        targetCardId: targetId,
        materialCardIds: Array.from(materialIds),
      });
      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error);
        return;
      }
      setResult(res.data);
      setMaterialIds(new Set());
    });
  }

  const canFuse = targetId !== null && materialIds.size >= 1 && !isPending;

  // ── Step 1: No target selected ───────────────────────────────────────────

  if (!target) {
    return (
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Step 1 — Select Target Card
        </h2>
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground">No active cards in your collection.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleSelectTarget(card)}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/50 hover:bg-card/80"
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
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-foreground">
                  Lv. {card.level}
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

  // ── Success state ────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="space-y-6">
        <Alert className="border-green-800 bg-green-950/40 text-center">
          <AlertDescription className="space-y-1 text-center">
            <p className="text-base font-semibold text-green-300">Fusion successful!</p>
            <p className="text-sm text-foreground/80">
              <span className="font-medium text-foreground">{result.fusion.xpGained} XP</span>{" "}
              transferred to{" "}
              <span className="font-medium text-foreground">{result.targetCard.template.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              New level:{" "}
              <span className="font-medium text-foreground">{result.targetCard.level}</span>
            </p>
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="w-full" size="lg" onClick={handleReset}>
          Fuse More Cards
        </Button>
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
            Target Card
          </h2>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Change
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
                <span className="text-xs text-muted-foreground">Level {target.level}</span>
                <RarityBadge rarity={target.template.rarity as CardRarity} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material selection */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Step 2 — Select Materials ({materialIds.size}/5)
        </h2>
        {eligibleMaterials.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No other cards of the same type available as materials.
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
                  "group flex flex-col overflow-hidden rounded-xl border transition-colors disabled:opacity-40",
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
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-foreground">
                    Lv. {card.level}
                  </span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
                      Selected
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

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Fuse button */}
      <Button
        onClick={handleFuse}
        disabled={!canFuse}
        className="w-full"
        size="lg"
      >
        {isPending
          ? "Fusing…"
          : `Fuse with ${materialIds.size} material${materialIds.size !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
