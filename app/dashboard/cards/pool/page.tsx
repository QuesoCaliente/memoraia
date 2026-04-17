import { getPool } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { PoolList } from "./pool-list";

export default async function PoolPage() {
  await requireStreamer();
  const pool = await getPool();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Pool de cartas</h1>
      <p className="text-sm text-muted-foreground">
        Administrá las cartas del sistema en tu canal. Activá o desactivá cartas y configurá pesos de drop personalizados.
      </p>
      <PoolList initialEntries={pool.data} />
    </div>
  );
}
