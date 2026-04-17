import { getBattles } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { BattleList } from "./battle-list";

export default async function BattlesPage() {
  await requireStreamer();
  const battles = await getBattles({ limit: 50 });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Batallas</h1>
      <BattleList initialBattles={battles.data} total={battles.total} />
    </div>
  );
}
