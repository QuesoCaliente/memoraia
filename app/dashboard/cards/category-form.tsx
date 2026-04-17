"use client";

import { useState } from "react";
import { createCategory, updateCategory } from "@/app/actions/cards";
import type { CardCategory } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CategoryFormProps {
  category?: CardCategory;
  onSave: (category: CardCategory) => void;
  onCancel?: () => void;
}

function mapFormError(error: string): string {
  switch (error) {
    case "conflict":
      return "Ya existe una categoría con ese nombre";
    case "forbidden":
      return "Se requieren permisos de streamer";
    case "unauthorized":
      return "Sesión expirada. Volvé a iniciar sesión.";
    default:
      return "Algo salió mal. Intentá de nuevo.";
  }
}

export function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [isPending, setIsPending] = useState(false);

  const isEditing = !!category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      const result = isEditing
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);

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
        setDescription("");
      }

      onSave(result.data);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`cat-name-${category?.id ?? "new"}`}>
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`cat-name-${category?.id ?? "new"}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la categoría"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`cat-desc-${category?.id ?? "new"}`}>Descripción</Label>
        <Textarea
          id={`cat-desc-${category?.id ?? "new"}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción opcional"
          rows={2}
          disabled={isPending}
          className="resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending || !name.trim()}
          aria-busy={isPending}
        >
          {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Agregar categoría"}
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
