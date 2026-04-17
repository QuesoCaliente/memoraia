import { getInventory } from "@/app/lib/api";
import { FuseForm } from "./fuse-form";

export default async function FusePage() {
  const inventory = await getInventory({ isActive: true });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fusionar cartas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seleccioná una carta objetivo y elegí entre 1 y 5 cartas del mismo tipo como materiales. Los materiales se destruyen y su XP se transfiere al objetivo.
        </p>
      </div>
      <FuseForm cards={inventory.data} />
    </div>
  );
}
