import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/admin-guard";
import { findPage } from "@/lib/page-content";
import { trpc } from "@/trpc/server";
import { PageEditor } from "@/components/admin/page-editor";

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return { title: findPage(page)?.name ?? "Page" };
}

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  await requirePermission("pages.edit");
  const { page } = await params;

  const def = findPage(page);
  if (!def) notFound();

  const { content } = await trpc.page.get({ page });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{def.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{def.path}</p>
      </div>
      <PageEditor def={def} initial={content} />
    </div>
  );
}
