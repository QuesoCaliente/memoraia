import { getBattles } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { BattleList } from "./battle-list";
import Link from "next/link";

export default async function BattlesPage() {
  await requireStreamer();
  const battles = await getBattles({ limit: 50 });

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Battles</h1>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
        <BattleList initialBattles={battles.data} total={battles.total} />
      </div>
    </div>
  );
}
