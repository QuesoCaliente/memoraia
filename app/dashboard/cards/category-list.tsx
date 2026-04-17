"use client";

import { useState } from "react";
import { deleteCategory } from "@/app/actions/cards";
import type { CardCategory } from "@/app/types/cards";
import { CategoryForm } from "./category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface CategoryListProps {
  initialCategories: CardCategory[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState<CardCategory[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteCategory(id);
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        if (result.error === "has_templates") {
          toast.error("No se puede eliminar: esta categoría tiene templates asignados.");
        } else {
          toast.error("No se pudo eliminar la categoría. Intentá de nuevo.");
        }
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoría eliminada");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved(updated: CardCategory) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    setEditingId(null);
  }

  const isPending = !!deletingId;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">Categorías</h2>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <FolderPlus className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">No hay categorías</p>
            <p className="text-sm text-muted-foreground">
              Creá tu primera categoría para organizar tus cartas
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <Card
              key={category.id}
              size="sm"
              className="transition-all duration-200 hover:shadow-sm"
            >
              <CardContent>
                {editingId === category.id ? (
                  <CategoryForm
                    category={category}
                    onSave={handleSaved}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{category.name}</span>
                        <Badge variant={category.origin === "system" ? "secondary" : "outline"}>
                          {category.origin === "system" ? "Sistema" : "Personalizada"}
                        </Badge>
                      </div>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(category.id)}
                        disabled={isPending}
                      >
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isPending}
                            />
                          }
                        >
                          Eliminar
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esto eliminará permanentemente &quot;{category.name}&quot;. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={deletingId === category.id}
                              aria-busy={deletingId === category.id}
                              onClick={() => handleDelete(category.id)}
                            >
                              {deletingId === category.id ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle>Nueva categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm onSave={handleSaved} />
        </CardContent>
      </Card>
    </div>
  );
}
