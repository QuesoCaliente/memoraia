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
        <h1 className="text-2xl font-bold text-foreground">Economía de polvo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Destruí cartas para obtener polvo y usalo para fabricar nuevas.
        </p>
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
