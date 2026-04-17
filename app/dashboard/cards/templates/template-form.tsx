"use client";

import { useState } from "react";
import { createTemplate, updateTemplate } from "@/app/actions/cards";
import type { CardCategory, CardTemplate, CardRarity, CardOrigin } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RARITIES } from "@/lib/rarity";

interface TemplateFormProps {
  template?: CardTemplate;
  categories: CardCategory[];
  onSave: (template: CardTemplate) => void;
  onCancel?: () => void;
}

const ORIGINS: CardOrigin[] = ["streamer", "system"];

function mapFormError(error: string): string {
  switch (error) {
    case "conflict":
      return "Ya existe un template con ese nombre.";
    case "forbidden":
      return "Se requieren permisos de streamer.";
    case "unauthorized":
      return "Sesión expirada. Volvé a iniciar sesión.";
    default:
      return "Algo salió mal. Intentá de nuevo.";
  }
}

export function TemplateForm({ template, categories, onSave, onCancel }: TemplateFormProps) {
  const isEditing = !!template;

  const [name, setName] = useState(template?.name ?? "");
  const [imageUrl, setImageUrl] = useState(template?.imageUrl ?? "");
  const [rarity, setRarity] = useState<CardRarity>(template?.rarity ?? "common");
  const [origin, setOrigin] = useState<CardOrigin>(template?.origin ?? "streamer");
  const [categoryId, setCategoryId] = useState(template?.categoryId ?? "");
  const [description, setDescription] = useState(template?.description ?? "");

  // Campos de stats (solo en edición)
  const [baseAttack, setBaseAttack] = useState(String(template?.baseAttack ?? 0));
  const [baseDefense, setBaseDefense] = useState(String(template?.baseDefense ?? 0));
  const [baseAgility, setBaseAgility] = useState(String(template?.baseAgility ?? 0));
  const [growthAttack, setGrowthAttack] = useState(String(template?.growthAttack ?? 0));
  const [growthDefense, setGrowthDefense] = useState(String(template?.growthDefense ?? 0));
  const [growthAgility, setGrowthAgility] = useState(String(template?.growthAgility ?? 0));
  const [dropWeight, setDropWeight] = useState(String(template?.dropWeight ?? 1));
  const [maxSupply, setMaxSupply] = useState(
    template?.maxSupply != null ? String(template.maxSupply) : ""
  );

  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim()) return;

    setIsPending(true);

    try {
      let result;

      if (isEditing) {
        result = await updateTemplate(template.id, {
          name: name.trim(),
          imageUrl: imageUrl.trim(),
          rarity,
          categoryId: categoryId || null,
          description: description.trim() || undefined,
          baseAttack: Number(baseAttack),
          baseDefense: Number(baseDefense),
          baseAgility: Number(baseAgility),
          growthAttack: Number(growthAttack),
          growthDefense: Number(growthDefense),
          growthAgility: Number(growthAgility),
          dropWeight: Number(dropWeight),
          maxSupply: maxSupply !== "" ? Number(maxSupply) : null,
        });
      } else {
        result = await createTemplate({
          origin,
          name: name.trim(),
          imageUrl: imageUrl.trim(),
          rarity,
          categoryId: categoryId || undefined,
          description: description.trim() || undefined,
        });
      }

      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        toast.error(mapFormError(result.error));
        return;
      }

      if (!isEditing) {
        setName("");
        setImageUrl("");
        setRarity("common");
        setOrigin("streamer");
        setCategoryId("");
        setDescription("");
      }

      onSave(result.data);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tmpl-name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tmpl-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del template"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tmpl-image">
            URL de imagen <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tmpl-image"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            required
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tmpl-rarity">
            Rareza <span className="text-destructive">*</span>
          </Label>
          <Select
            value={rarity}
            onValueChange={(v) => setRarity(v as CardRarity)}
            disabled={isPending}
          >
            <SelectTrigger id="tmpl-rarity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RARITIES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tmpl-origin">
            Origen <span className="text-destructive">*</span>
          </Label>
          <Select
            value={origin}
            onValueChange={(v) => setOrigin(v as CardOrigin)}
            disabled={isPending || isEditing}
          >
            <SelectTrigger id="tmpl-origin" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORIGINS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o.charAt(0).toUpperCase() + o.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tmpl-category">Categoría</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v ?? "")}
            disabled={isPending}
          >
            <SelectTrigger id="tmpl-category" className="w-full">
              <SelectValue placeholder="— Ninguna —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">— Ninguna —</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tmpl-desc">Descripción</Label>
        <Textarea
          id="tmpl-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción opcional"
          rows={2}
          disabled={isPending}
          className="resize-none"
        />
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stats
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["ATK Base", baseAttack, setBaseAttack],
                ["DEF Base", baseDefense, setBaseDefense],
                ["AGI Base", baseAgility, setBaseAgility],
                ["ATK Crecimiento", growthAttack, setGrowthAttack],
                ["DEF Crecimiento", growthDefense, setGrowthDefense],
                ["AGI Crecimiento", growthAgility, setGrowthAgility],
              ] as const
            ).map(([label, value, setter]) => (
              <div key={label} className="flex flex-col gap-1.5">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  min={0}
                  step={1}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Peso de drop</Label>
              <Input
                type="number"
                value={dropWeight}
                onChange={(e) => setDropWeight(e.target.value)}
                min={0}
                step={0.01}
                disabled={isPending}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Suministro máximo</Label>
              <Input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
                min={1}
                step={1}
                placeholder="Ilimitado"
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending || !name.trim() || !imageUrl.trim()}
          aria-busy={isPending}
        >
          {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar template"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
