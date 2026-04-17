import { getPool } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { PoolList } from "./pool-list";

export default async function PoolPage() {
  await requireStreamer();
  const pool = await getPool();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Card Pool</h1>
      <p className="text-sm text-muted-foreground">
        Manage system cards in your channel. Toggle cards on/off and set custom drop weights.
      </p>
      <PoolList initialEntries={pool.data} />
    </div>
  );
}
