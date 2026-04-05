"use client";

import { useState } from "react";
import { createTemplate, updateTemplate } from "@/app/actions/cards";
import type { CardCategory, CardTemplate, CardRarity, CardOrigin } from "@/app/types/cards";

interface TemplateFormProps {
  template?: CardTemplate;
  categories: CardCategory[];
  onSave: (template: CardTemplate) => void;
  onCancel?: () => void;
}

const RARITIES: CardRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const ORIGINS: CardOrigin[] = ["streamer", "system"];

function mapFormError(error: string): string {
  switch (error) {
    case "conflict":
      return "A template with this name already exists.";
    case "forbidden":
      return "Streamer permissions required.";
    case "unauthorized":
      return "Session expired. Please log in again.";
    default:
      return "Something went wrong. Please try again.";
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

  // Edit-only stat fields
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

  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !imageUrl.trim()) return;

    setIsPending(true);
    setError(null);

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
        setError(mapFormError(result.error));
        setTimeout(() => setError(null), 4000);
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

  const inputClass =
    "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-500 disabled:opacity-50";
  const labelClass = "text-sm text-zinc-400";
  const fieldClass = "flex flex-col gap-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={labelClass}>
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
            required
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>
            Image URL <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            required
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>
            Rarity <span className="text-red-400">*</span>
          </label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as CardRarity)}
            disabled={isPending}
            className={inputClass}
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>
            Origin <span className="text-red-400">*</span>
          </label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value as CardOrigin)}
            disabled={isPending || isEditing}
            className={inputClass}
          >
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {o.charAt(0).toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isPending}
            className={inputClass}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={fieldClass}>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          disabled={isPending}
          className={`resize-none ${inputClass}`}
        />
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3 rounded-md border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Stats
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["Base ATK", baseAttack, setBaseAttack],
                ["Base DEF", baseDefense, setBaseDefense],
                ["Base AGI", baseAgility, setBaseAgility],
                ["Growth ATK", growthAttack, setGrowthAttack],
                ["Growth DEF", growthDefense, setGrowthDefense],
                ["Growth AGI", growthAgility, setGrowthAgility],
              ] as const
            ).map(([label, value, setter]) => (
              <div key={label} className={fieldClass}>
                <label className={labelClass}>{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  min={0}
                  step={1}
                  disabled={isPending}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldClass}>
              <label className={labelClass}>Drop Weight</label>
              <input
                type="number"
                value={dropWeight}
                onChange={(e) => setDropWeight(e.target.value)}
                min={0}
                step={0.01}
                disabled={isPending}
                className={inputClass}
              />
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Max Supply</label>
              <input
                type="number"
                value={maxSupply}
                onChange={(e) => setMaxSupply(e.target.value)}
                min={1}
                step={1}
                placeholder="Unlimited"
                disabled={isPending}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !name.trim() || !imageUrl.trim()}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Add Template"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
