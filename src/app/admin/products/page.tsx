import Link from "next/link";
import Image from "next/image";
import { asc, desc, ilike, or, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requirePermission } from "@/lib/admin-guard";
import { formatPrice } from "@/lib/shop-config";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
import { Input } from "@/components/ui-kit/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit/table";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("products.view");
  const { q } = await searchParams;
  const search = q?.trim();

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      price: products.price,
      stock: products.stock,
      trackStock: products.trackStock,
      active: products.active,
      featured: products.featured,
      image: products.image,
      lowStockAt: products.lowStockAt,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, sql`${products.categoryId} = ${categories.id}`)
    .where(
      search
        ? or(
            ilike(products.name, `%${search}%`),
            ilike(products.sku, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(desc(products.active), asc(products.sortOrder), asc(products.name));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "product" : "products"}
            {search ? ` matching “${search}”` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            New product
          </Link>
        </Button>
      </div>

      <form className="max-w-sm">
        <Input
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by name or SKU…"
          aria-label="Search products"
        />
      </form>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14" />
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const low = row.trackStock && row.stock <= row.lowStockAt;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                      {row.image ? (
                        <Image
                          src={row.image}
                          alt=""
                          width={80}
                          height={80}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.sku}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.categoryName}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(row.price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.trackStock ? (
                      <span className={low ? "font-medium text-amber-600" : ""}>
                        {row.stock}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">∞</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={row.active ? "secondary" : "outline"}>
                        {row.active ? "Active" : "Hidden"}
                      </Badge>
                      {row.featured ? <Badge>Featured</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      id={row.id}
                      slug={row.slug}
                      name={row.name}
                      active={row.active}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No products found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
