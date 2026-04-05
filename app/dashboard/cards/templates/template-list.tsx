"use client";

import { useState } from "react";
import { deleteTemplate } from "@/app/actions/cards";
import type { CardCategory, CardRarity, CardTemplate } from "@/app/types/cards";
import { TemplateForm } from "./template-form";

interface TemplateListProps {
  initialTemplates: CardTemplate[];
  total: number;
  categories: CardCategory[];
}

const RARITY_BADGE: Record<CardRarity, string> = {
  common: "bg-zinc-700 text-zinc-300",
  uncommon: "bg-green-900 text-green-300",
  rare: "bg-blue-900 text-blue-300",
  epic: "bg-purple-900 text-purple-300",
  legendary: "bg-amber-900 text-amber-300",
};

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
        return;
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: false } : t))
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {activeCount} active · {total} total
        </p>
        <button
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          {showCreateForm ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-base font-semibold text-white">New Template</h2>
          <TemplateForm
            categories={categories}
            onSave={handleCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {templates.length === 0 && (
        <p className="text-center text-sm text-zinc-500">No templates yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {templates.map((template) =>
          editingId === template.id ? (
            <div
              key={template.id}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-5"
            >
              <h2 className="mb-4 text-base font-semibold text-white">
                Editing: {template.name}
              </h2>
              <TemplateForm
                template={template}
                categories={categories}
                onSave={handleUpdated}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={template.id}
              className={`flex gap-4 rounded-lg border bg-zinc-900 p-4 ${
                template.isActive ? "border-zinc-800" : "border-zinc-800 opacity-50"
              }`}
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
                {template.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                    No img
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">
                    {template.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RARITY_BADGE[template.rarity]}`}
                  >
                    {template.rarity}
                  </span>
                  {!template.isActive && (
                    <span className="shrink-0 rounded-full bg-red-900 px-2 py-0.5 text-xs font-medium text-red-300">
                      inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  Category: {getCategoryName(template.categoryId)} · Origin:{" "}
                  {template.origin}
                </p>
                {template.description && (
                  <p className="truncate text-xs text-zinc-400">
                    {template.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  onClick={() => setEditingId(template.id)}
                  disabled={!!deletingId}
                  className="rounded-md border border-zinc-700 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                >
                  Edit
                </button>
                {template.isActive && (
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                    className="rounded-md border border-red-800 bg-transparent px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950 disabled:opacity-50"
                  >
                    {deletingId === template.id ? "..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
