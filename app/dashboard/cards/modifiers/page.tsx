import { getModifiers } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { ModifierGrid } from "./modifier-grid";
import Link from "next/link";

export default async function ModifiersPage() {
  await requireStreamer();
  const modifiers = await getModifiers();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tier Rarity Modifiers</h1>
          <Link href="/dashboard/cards" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Cards
          </Link>
        </div>
        <p className="text-sm text-zinc-400">
          Configure drop weight multipliers by subscription tier and card rarity. Higher values increase the chance of that rarity for that tier.
        </p>
        <ModifierGrid initialModifiers={modifiers} />
    </div>
  );
}
