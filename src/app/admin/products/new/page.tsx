import { ProductForm } from "@/components/admin/product-form";
import { requirePermission } from "@/lib/admin-guard";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requirePermission("products.edit");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save the basics first, then add images to it.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
