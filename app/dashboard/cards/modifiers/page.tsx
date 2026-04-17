import { getModifiers } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { ModifierGrid } from "./modifier-grid";

export default async function ModifiersPage() {
  await requireStreamer();
  const modifiers = await getModifiers();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Modificadores por rareza y tier</h1>
      <p className="text-sm text-muted-foreground">
        Configurá los multiplicadores de peso de drop según el tier de suscripción y la rareza. Valores más altos aumentan la probabilidad de esa rareza para ese tier.
      </p>
      <ModifierGrid initialModifiers={modifiers} />
    </div>
  );
}
