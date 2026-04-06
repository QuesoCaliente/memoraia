import { getTemplates, getCategories } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { TemplateList } from "./template-list";
import Link from "next/link";

export default async function TemplatesPage() {
  await requireStreamer();
  const [templatesResponse, categories] = await Promise.all([
    getTemplates(),
    getCategories(),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Card Templates</h1>
          <Link
            href="/dashboard/cards"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Categories
          </Link>
        </div>
        <TemplateList
          initialTemplates={templatesResponse.data}
          total={templatesResponse.total}
          categories={categories}
        />
      </div>
    </div>
  );
}
