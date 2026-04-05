import { getDustHistory, getInventory } from "@/app/lib/api";
import { DustPanel } from "./dust-panel";
import Link from "next/link";

export default async function DustPage() {
  const [history, inventory] = await Promise.all([
    getDustHistory({ limit: 20 }),
    getInventory({ isActive: true }),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dust Economy</h1>
          <Link href="/dashboard/inventory" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Collection
          </Link>
        </div>
        <DustPanel
          initialBalance={history.currentBalance}
          initialHistory={history.data}
          historyTotal={history.total}
          cards={inventory.data}
        />
      </div>
    </div>
  );
}
