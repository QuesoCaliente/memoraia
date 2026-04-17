import { getDustHistory, getInventory } from "@/app/lib/api";
import { DustPanel } from "./dust-panel";

export default async function DustPage() {
  const [history, inventory] = await Promise.all([
    getDustHistory({ limit: 20 }),
    getInventory({ isActive: true }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dust Economy</h1>
      </div>
      <DustPanel
        initialBalance={history.currentBalance}
        initialHistory={history.data}
        historyTotal={history.total}
        cards={inventory.data}
      />
    </div>
  );
}
