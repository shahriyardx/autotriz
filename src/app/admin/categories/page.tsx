import { trpc } from "@/trpc/server";
import { requirePermission } from "@/lib/admin-guard";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requirePermission("categories.edit");
  const rows = await trpc.category.list();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Categories group products on the shop and drive the range pages.
          Nest them to build sub-categories.
        </p>
      </div>
      <CategoryManager initial={rows} />
    </div>
  );
}
