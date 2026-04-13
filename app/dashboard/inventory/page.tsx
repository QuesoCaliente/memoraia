import { getInventory } from "@/app/lib/api";
import { InventoryGrid } from "./inventory-grid";
import Link from "next/link";

export default async function InventoryPage() {
  const inventory = await getInventory({ limit: 20 });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Collection</h1>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 transition-colors hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex gap-4">
          <Link
            href="/dashboard/inventory/fuse"
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 p-4 text-center text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Fuse Cards
          </Link>
          <Link
            href="/dashboard/inventory/dust"
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 p-4 text-center text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Dust Economy
          </Link>
        </div>
        <InventoryGrid initialCards={inventory.data} total={inventory.total} />
    </div>
  );
}
