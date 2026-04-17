"use client";

import { useState } from "react";
import { updatePoolEntry } from "@/app/actions/cards";
import type { PoolEntry } from "@/app/types/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface PoolListProps {
  initialEntries: PoolEntry[];
}

interface RowState {
  pending: boolean;
}

export function PoolList({ initialEntries }: PoolListProps) {
  const [entries, setEntries] = useState<PoolEntry[]>(initialEntries);
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({});

  function getRow(templateId: string): RowState {
    return rowState[templateId] ?? { pending: false };
  }

  function setRow(templateId: string, state: Partial<RowState>) {
    setRowState((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] ?? { pending: false }), ...state },
    }));
  }

  async function handleToggle(entry: PoolEntry) {
    const templateId = entry.templateId;
    setRow(templateId, { pending: true });
    try {
      const result = await updatePoolEntry(templateId, { isEnabled: !entry.isEnabled });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        toast.error("No se pudo actualizar. Intentá de nuevo.");
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
      toast.error("El peso debe ser un número no negativo.");
      return;
    }

    setRow(templateId, { pending: true });
    try {
      const result = await updatePoolEntry(templateId, { customWeight: parsed });
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        toast.error("No se pudo guardar el peso. Intentá de nuevo.");
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
      toast.success("Peso actualizado");
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
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
        <Layers className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">Pool vacío</p>
          <p className="text-sm text-muted-foreground">
            Agregá templates para configurar el pool de drops
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const { pending } = getRow(entry.templateId);
        const draftValue = weightDraft[entry.templateId];
        const weightValue =
          draftValue !== undefined
            ? draftValue
            : entry.customWeight !== null
            ? String(entry.customWeight)
            : "";
        const rarityConf = RARITY_CONFIG[entry.template.rarity];

        return (
          <Card
            key={entry.id}
            size="sm"
            className="transition-all duration-200 hover:shadow-sm"
          >
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
                  Peso base: {entry.template.dropWeight}
                </span>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Peso personalizado</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(entry.template.dropWeight)}
                    value={weightValue}
                    disabled={pending}
                    aria-busy={pending}
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
                    {entry.isEnabled ? "Habilitado" : "Deshabilitado"}
                  </span>
                  <Switch
                    checked={entry.isEnabled}
                    disabled={pending}
                    onCheckedChange={() => handleToggle(entry)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
