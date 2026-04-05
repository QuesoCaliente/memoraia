import { getCategories } from "@/app/lib/api";
import { CategoryList } from "./category-list";
import Link from "next/link";

export default async function CardsPage() {
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-2xl space-y-8">
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
        <CategoryList initialCategories={categories} />
      </div>
    </div>
  );
}
