import { getInventory } from "@/app/lib/api";
import { FuseForm } from "./fuse-form";
import Link from "next/link";

export default async function FusePage() {
  const inventory = await getInventory({ isActive: true });

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Fuse Cards</h1>
          <Link href="/dashboard/inventory" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Collection
          </Link>
        </div>
        <p className="text-sm text-zinc-400">
          Select a target card, then choose 1-5 cards of the same type as materials. Materials are destroyed and their XP transfers to the target.
        </p>
        <FuseForm cards={inventory.data} />
      </div>
    </div>
  );
}
