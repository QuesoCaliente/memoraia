import { getInventory } from "@/app/lib/api";
import { InventoryGrid } from "./inventory-grid";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InventoryPage() {
  const inventory = await getInventory({ limit: 20 });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Collection</h1>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" size="lg" className="flex-1" render={<Link href="/dashboard/inventory/fuse" />}>
          Fuse Cards
        </Button>
        <Button variant="outline" size="lg" className="flex-1" render={<Link href="/dashboard/inventory/dust" />}>
          Dust Economy
        </Button>
      </div>
      <InventoryGrid initialCards={inventory.data} total={inventory.total} />
    </div>
  );
}
