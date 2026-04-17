"use client";

import { useState } from "react";
import { createCategory, updateCategory } from "@/app/actions/cards";
import type { CardCategory } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CategoryFormProps {
  category?: CardCategory;
  onSave: (category: CardCategory) => void;
  onCancel?: () => void;
}

function mapFormError(error: string): string {
  switch (error) {
    case "conflict":
      return "A category with this name already exists";
    case "forbidden":
      return "Streamer permissions required";
    case "unauthorized":
      return "Session expired. Please log in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isEditing = !!category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsPending(true);
    setError(null);

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
        setError(mapFormError(result.error));
        setTimeout(() => setError(null), 4000);
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
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id={`cat-name-${category?.id ?? "new"}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          required
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`cat-desc-${category?.id ?? "new"}`}>Description</Label>
        <Textarea
          id={`cat-desc-${category?.id ?? "new"}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          disabled={isPending}
          className="resize-none"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isPending || !name.trim()}
        >
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Category"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
