import { getModifiers } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { ModifierGrid } from "./modifier-grid";

export default async function ModifiersPage() {
  await requireStreamer();
  const modifiers = await getModifiers();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Tier Rarity Modifiers</h1>
      <p className="text-sm text-muted-foreground">
        Configure drop weight multipliers by subscription tier and card rarity. Higher values increase the chance of that rarity for that tier.
      </p>
      <ModifierGrid initialModifiers={modifiers} />
    </div>
  );
}
