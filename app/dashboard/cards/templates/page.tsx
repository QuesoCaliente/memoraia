import { getTemplates, getCategories } from "@/app/lib/api";
import { requireStreamer } from "@/app/lib/guards";
import { TemplateList } from "./template-list";

export default async function TemplatesPage() {
  await requireStreamer();
  const [templatesResponse, categories] = await Promise.all([
    getTemplates(),
    getCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Card Templates</h1>
      <TemplateList
        initialTemplates={templatesResponse.data}
        total={templatesResponse.total}
        categories={categories}
      />
    </div>
  );
}
