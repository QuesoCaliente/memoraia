"use client";

import { useState } from "react";
import { updatePoolEntry } from "@/app/actions/cards";
import type { PoolEntry } from "@/app/types/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface PoolListProps {
  initialEntries: PoolEntry[];
}

interface RowState {
  pending: boolean;
  error: string | null;
}

export function PoolList({ initialEntries }: PoolListProps) {
  const [entries, setEntries] = useState<PoolEntry[]>(initialEntries);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({});

  function getRow(templateId: string): RowState {
    return rowState[templateId] ?? { pending: false, error: null };
  }

  function setRow(templateId: string, state: Partial<RowState>) {
    setRowState((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] ?? { pending: false, error: null }), ...state },
    }));
  }

  async function handleToggle(entry: PoolEntry) {
    const templateId = entry.templateId;
    setRow(templateId, { pending: true, error: null });
    try {
      const result = await updatePoolEntry(templateId, { isEnabled: !entry.isEnabled });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        setRow(templateId, { error: "Failed to update. Please try again." });
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.templateId === templateId ? result.data : e))
      );
    } finally {
      setRow(templateId, { pending: false });
    }
  }

  async function handleWeightSave(entry: PoolEntry) {
    const templateId = entry.templateId;
    const draft = weightDraft[templateId];
    if (draft === undefined) return;

    const parsed = draft === "" ? null : Number(draft);
    if (draft !== "" && (isNaN(parsed as number) || (parsed as number) < 0)) {
      setRow(templateId, { error: "Weight must be a non-negative number." });
      return;
    }

    setRow(templateId, { pending: true, error: null });
    try {
      const result = await updatePoolEntry(templateId, { customWeight: parsed });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        setRow(templateId, { error: "Failed to save weight. Please try again." });
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.templateId === templateId ? result.data : e))
      );
      setWeightDraft((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    } finally {
      setRow(templateId, { pending: false });
    }
  }

  function handleWeightKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    entry: PoolEntry
  ) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No cards in pool.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const { pending, error } = getRow(entry.templateId);
        const draftValue = weightDraft[entry.templateId];
        const weightValue =
          draftValue !== undefined
            ? draftValue
            : entry.customWeight !== null
            ? String(entry.customWeight)
            : "";
        const rarityConf = RARITY_CONFIG[entry.template.rarity];

        return (
          <Card key={entry.id} size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className={cn(
                    rarityConf.bg,
                    rarityConf.text,
                    "border",
                    rarityConf.border
                  )}
                >
                  {entry.template.rarity}
                </Badge>

                <span className="flex-1 font-medium text-foreground min-w-0 truncate">
                  {entry.template.name}
                </span>

                <span className="shrink-0 text-xs text-muted-foreground">
                  Base weight: {entry.template.dropWeight}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Custom weight</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(entry.template.dropWeight)}
                    value={weightValue}
                    disabled={pending}
                    className="w-24"
                    onChange={(e) =>
                      setWeightDraft((prev) => ({
                        ...prev,
                        [entry.templateId]: e.target.value,
                      }))
                    }
                    onBlur={() => handleWeightSave(entry)}
                    onKeyDown={(e) => handleWeightKeyDown(e, entry)}
                  />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {entry.isEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={entry.isEnabled}
                    disabled={pending}
                    onCheckedChange={() => handleToggle(entry)}
                  />
                </div>

                {pending && (
                  <span className="shrink-0 text-xs text-muted-foreground">Saving…</span>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
