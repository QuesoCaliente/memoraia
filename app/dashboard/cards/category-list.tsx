"use client";

import { useState } from "react";
import { deleteCategory } from "@/app/actions/cards";
import type { CardCategory } from "@/app/types/cards";
import { CategoryForm } from "./category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [error, setError] = useState<string | null>(null);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

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
          showError("Cannot delete: this category has templates assigned to it.");
        } else {
          showError("Failed to delete category. Please try again.");
        }
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
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
      <h2 className="text-lg font-semibold text-foreground">Categories</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <Card key={category.id} size="sm">
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
                          {category.origin === "system" ? "System" : "Custom"}
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
                        Edit
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
                          Delete
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete category?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{category.name}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={deletingId === category.id}
                              onClick={() => handleDelete(category.id)}
                            >
                              {deletingId === category.id ? "Deleting..." : "Delete"}
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
          <CardTitle>New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm onSave={handleSaved} />
        </CardContent>
      </Card>
    </div>
  );
}
