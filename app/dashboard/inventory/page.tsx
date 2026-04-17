import { getInventory } from "@/app/lib/api";
import { InventoryGrid } from "./inventory-grid";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InventoryPage() {
  const inventory = await getInventory({ limit: 20 });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi colección</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las cartas que obtuviste hasta ahora.
        </p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" size="lg" className="flex-1" render={<Link href="/dashboard/inventory/fuse" />}>
          Fusionar cartas
        </Button>
        <Button variant="outline" size="lg" className="flex-1" render={<Link href="/dashboard/inventory/dust" />}>
          Economía de polvo
        </Button>
      </div>
      <InventoryGrid initialCards={inventory.data} total={inventory.total} />
    </div>
  );
}
