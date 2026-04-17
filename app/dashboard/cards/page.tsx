import { getCategories } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { CategoryList } from "./category-list";
import Link from "next/link";

export default async function CardsPage() {
  const user = await requireStreamer();
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Gestión de cartas</h1>

      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/cards/templates"
          className="block rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-foreground transition-colors hover:bg-muted"
        >
          Administrar templates →
        </Link>
        <Link
          href="/dashboard/cards/pool"
          className="block rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-foreground transition-colors hover:bg-muted"
        >
          Pool de cartas →
        </Link>
        <Link
          href="/dashboard/cards/modifiers"
          className="block rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-foreground transition-colors hover:bg-muted"
        >
          Modificadores por tier →
        </Link>
        {user.role === "admin" && (
          <Link
            href="/dashboard/cards/drop"
            className="block rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-primary transition-colors hover:bg-muted"
          >
            Simular drop →
          </Link>
        )}
      </div>

      <CategoryList initialCategories={categories} />
    </div>
  );
}
