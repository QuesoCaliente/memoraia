"use client";

import { useState } from "react";
import { deleteCategory } from "@/app/actions/cards";
import type { CardCategory } from "@/app/types/cards";
import { CategoryForm } from "./category-form";

interface CategoryListProps {
  initialCategories: CardCategory[];
}

function OriginBadge({ origin }: { origin: CardCategory["origin"] }) {
  const isSystem = origin === "system";
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        isSystem
          ? "bg-zinc-700 text-zinc-300"
          : "bg-purple-900 text-purple-300"
      }`}
    >
      {isSystem ? "System" : "Custom"}
    </span>
  );
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
      <h2 className="text-lg font-semibold text-white">Categories</h2>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-zinc-500">No categories yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
            >
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
                      <span className="font-medium text-white">{category.name}</span>
                      <OriginBadge origin={category.origin} />
                    </div>
                    {category.description && (
                      <p className="text-sm text-zinc-400">{category.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setEditingId(category.id)}
                      disabled={isPending}
                      className="rounded-md border border-zinc-700 bg-transparent px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={isPending || deletingId === category.id}
                      className="rounded-md border border-red-800 bg-transparent px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-950 disabled:opacity-50"
                    >
                      {deletingId === category.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">New Category</h3>
        <CategoryForm onSave={handleSaved} />
      </div>
    </div>
  );
}
