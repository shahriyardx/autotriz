import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { productCategories, products } from "@/db/schema";
import { ProductForm } from "@/components/admin/product-form";
import { requirePermission } from "@/lib/admin-guard";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("products.edit");
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) notFound();

  const links = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{product.sku}</p>
        </div>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
        >
          View on site
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ProductForm
        product={{ ...product, categoryIds: links.map((l) => l.categoryId) }}
      />
    </div>
  );
}
