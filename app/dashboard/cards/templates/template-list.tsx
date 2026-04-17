"use client";

import { useState } from "react";
import { deleteTemplate } from "@/app/actions/cards";
import type { CardCategory, CardTemplate } from "@/app/types/cards";
import { TemplateForm } from "./template-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
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
import { RARITY_CONFIG } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface TemplateListProps {
  initialTemplates: CardTemplate[];
  total: number;
  categories: CardCategory[];
}

export function TemplateList({ initialTemplates, total, categories }: TemplateListProps) {
  const [templates, setTemplates] = useState<CardTemplate[]>(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return "—";
    return categories.find((c) => c.id === categoryId)?.name ?? "—";
  }

  function handleCreated(template: CardTemplate) {
    setTemplates((prev) => [template, ...prev]);
    setShowCreateForm(false);
  }

  function handleUpdated(updated: CardTemplate) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteTemplate(id);
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        toast.error("No se pudo eliminar el template");
        return;
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: false } : t))
      );
      toast.success("Template desactivado");
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeCount} activos · {total} total
        </p>
        <Button
          variant={showCreateForm ? "outline" : "default"}
          onClick={() => setShowCreateForm((v) => !v)}
        >
          {showCreateForm ? "Cancelar" : "+ Nuevo template"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo template</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              categories={categories}
              onSave={handleCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <FilePlus className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">No hay templates</p>
            <p className="text-sm text-muted-foreground">
              Creá tu primer template de carta
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {templates.map((template) =>
          editingId === template.id ? (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>Editando: {template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateForm
                  template={template}
                  categories={categories}
                  onSave={handleUpdated}
                  onCancel={() => setEditingId(null)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card
              key={template.id}
              className={cn(
                "transition-all duration-200 hover:shadow-sm",
                !template.isActive && "opacity-50"
              )}
            >
              <CardContent className="flex gap-4">
                {/* Miniatura */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  {template.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      Sin img
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {template.name}
                    </span>
                    <Badge
                      className={cn(
                        "shrink-0",
                        RARITY_CONFIG[template.rarity].bg,
                        RARITY_CONFIG[template.rarity].text,
                        "border",
                        RARITY_CONFIG[template.rarity].border
                      )}
                    >
                      {template.rarity}
                    </Badge>
                    {!template.isActive && (
                      <Badge variant="secondary" className="shrink-0">
                        inactivo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Categoría: {getCategoryName(template.categoryId)} · Origen:{" "}
                    {template.origin}
                  </p>
                  {template.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(template.id)}
                    disabled={!!deletingId}
                  >
                    Editar
                  </Button>
                  {template.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingId === template.id}
                            aria-busy={deletingId === template.id}
                          />
                        }
                      >
                        {deletingId === template.id ? "..." : "Eliminar"}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esto desactivará &quot;{template.name}&quot;. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={deletingId === template.id}
                            aria-busy={deletingId === template.id}
                            onClick={() => handleDelete(template.id)}
                          >
                            {deletingId === template.id ? "Eliminando..." : "Eliminar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
