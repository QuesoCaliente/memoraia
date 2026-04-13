import { getPool } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { PoolList } from "./pool-list";
import Link from "next/link";

export default async function PoolPage() {
  await requireStreamer();
  const pool = await getPool();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Card Pool</h1>
          <Link href="/dashboard/cards" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Cards
          </Link>
        </div>
        <p className="text-sm text-zinc-400">
          Manage system cards in your channel. Toggle cards on/off and set custom drop weights.
        </p>
        <PoolList initialEntries={pool.data} />
    </div>
  );
}
