import { getCategories } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { CategoryList } from "./category-list";
import Link from "next/link";

export default async function CardsPage() {
  const user = await requireStreamer();
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Card Management</h1>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <Link
        href="/dashboard/cards/templates"
        className="block rounded-md border border-zinc-800 bg-zinc-900 p-4 text-center text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        Manage Templates →
      </Link>
      <Link
        href="/dashboard/cards/pool"
        className="block rounded-md border border-zinc-800 bg-zinc-900 p-4 text-center text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        Card Pool →
      </Link>
      <Link
        href="/dashboard/cards/modifiers"
        className="block rounded-md border border-zinc-800 bg-zinc-900 p-4 text-center text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        Tier Modifiers →
      </Link>
      {user.role === "admin" && (
        <Link
          href="/dashboard/cards/drop"
          className="block rounded-md border border-yellow-800 bg-yellow-950 p-4 text-center text-yellow-300 transition-colors hover:bg-yellow-900 hover:text-yellow-200"
        >
          Simular Drop →
        </Link>
      )}
      <CategoryList initialCategories={categories} />
    </div>
  );
}
