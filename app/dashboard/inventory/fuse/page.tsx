import { getInventory } from "@/app/lib/api";
import { FuseForm } from "./fuse-form";

export default async function FusePage() {
  const inventory = await getInventory({ isActive: true });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fuse Cards</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a target card, then choose 1-5 cards of the same type as materials. Materials are destroyed and their XP transfers to the target.
        </p>
      </div>
      <FuseForm cards={inventory.data} />
    </div>
  );
}
