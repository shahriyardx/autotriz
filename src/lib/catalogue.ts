import "server-only";
import { and, asc, desc, eq, exists, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, productCategories, products } from "@/db/schema";
import type { SortKey } from "@/lib/shop-search";

/* ------------------------------------------------------------------
   The storefront's read model.

   Prices are stored in minor units and surfaced here as minor units
   too — formatting happens in one place, `formatPrice`.
   ------------------------------------------------------------------ */

export type Category = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  href: string;
  image: string | null;
  parentId: string | null;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  surface: string;
  description: string;
  shortDescription: string;
  /** The price to charge right now (the sale price while a sale is on). */
  price: number;
  /** The regular price, shown struck through while a sale is on. */
  compareAtPrice: number | null;
  size: string | null;
  features: string[];
  attributes: { name: string; values: string[]; visible: boolean }[];
  tags: string[];
  image: string | null;
  stock: number;
  trackStock: boolean;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  backorders: "no" | "notify" | "yes";
  soldIndividually: boolean;
  featured: boolean;
  category: Category;
};

export { currency, formatPrice } from "@/lib/shop-config";

export { inStock } from "@/lib/shop-search";

/** True while a sale price applies, honouring the optional schedule. */
export function saleIsOn(
  row: { salePrice: number | null; saleStartsAt: Date | null; saleEndsAt: Date | null },
  now = new Date(),
) {
  if (row.salePrice === null) return false;
  if (row.saleStartsAt && now < row.saleStartsAt) return false;
  if (row.saleEndsAt && now > row.saleEndsAt) return false;
  return true;
}

const selection = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  sku: products.sku,
  surface: products.surface,
  description: products.description,
  shortDescription: products.shortDescription,
  price: products.price,
  salePrice: products.salePrice,
  saleStartsAt: products.saleStartsAt,
  saleEndsAt: products.saleEndsAt,
  size: products.size,
  features: products.features,
  attributes: products.attributes,
  tags: products.tags,
  image: products.image,
  stock: products.stock,
  trackStock: products.trackStock,
  stockStatus: products.stockStatus,
  backorders: products.backorders,
  soldIndividually: products.soldIndividually,
  featured: products.featured,
  sortOrder: products.sortOrder,
  category: {
    id: categories.id,
    slug: categories.slug,
    name: categories.name,
    blurb: categories.blurb,
    href: categories.href,
    image: categories.image,
    parentId: categories.parentId,
  },
};

type Row = Awaited<ReturnType<ReturnType<typeof db.select<typeof selection>>["from"]>>[number];

/** Resolves the sale schedule into a single price to charge, and drops
 *  the ordering column, which is a detail of the query. */
function toProduct(row: Row): Product {
  const { sortOrder, salePrice, saleStartsAt, saleEndsAt, ...rest } = row;
  void sortOrder;
  const onSale = saleIsOn({ salePrice, saleStartsAt, saleEndsAt });
  return {
    ...rest,
    price: onSale ? salePrice! : rest.price,
    compareAtPrice: onSale ? rest.price : null,
  };
}

/** The ids of the named categories plus every sub-category under them,
 *  so browsing "Coatings" also shows what sits in "Coatings › Glass". */
async function categoryIdsForSlugs(slugs: string[]) {
  const rows = await db.execute<{ id: string }>(sql`
    with recursive tree as (
      select id from categories where slug in ${slugs}
      union all
      select c.id from categories c join tree on c.parent_id = tree.id
    )
    select id from tree
  `);
  return rows.map((r) => r.id);
}

export { sortKeys, type SortKey } from "@/lib/shop-search";

/** SQL for "is the sale price in force right now". */
const saleActive = sql`(${products.salePrice} is not null
  and (${products.saleStartsAt} is null or ${products.saleStartsAt} <= now())
  and (${products.saleEndsAt} is null or ${products.saleEndsAt} >= now()))`;

/** The price the customer pays right now, so filtering and sorting by
 *  price agree with what the card shows. */
const effectivePrice = sql<number>`case when ${saleActive} then ${products.salePrice} else ${products.price} end`;

const orderFor = (sort: SortKey) => {
  switch (sort) {
    case "price-asc":
      return [asc(effectivePrice), asc(products.name)];
    case "price-desc":
      return [desc(effectivePrice), asc(products.name)];
    case "name":
      return [asc(products.name)];
    case "newest":
      return [desc(products.createdAt)];
    default:
      return [desc(products.featured), asc(products.sortOrder), asc(products.name)];
  }
};

export type ProductQuery = {
  categorySlugs?: string[];
  surfaces?: string[];
  search?: string;
  /** Minor units. */
  minPrice?: number;
  /** Minor units. */
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  featuredOnly?: boolean;
  sort?: SortKey;
  limit?: number;
  offset?: number;
};

const inStockSql = or(
  and(eq(products.trackStock, false), sql`${products.stockStatus} <> 'outofstock'`),
  and(eq(products.trackStock, true), or(gte(products.stock, 1), sql`${products.backorders} <> 'no'`)),
)!;

async function filtersFor(query: ProductQuery) {
  const filters = [eq(products.active, true), sql`${products.catalogVisibility} <> 'hidden'`];

  if (query.categorySlugs?.length) {
    const ids = await categoryIdsForSlugs(query.categorySlugs);
    filters.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productCategories)
          .where(
            and(
              eq(productCategories.productId, products.id),
              inArray(productCategories.categoryId, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
            ),
          ),
      ),
    );
  }
  if (query.surfaces?.length) {
    filters.push(inArray(products.surface, query.surfaces));
  }
  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    filters.push(
      or(
        ilike(products.name, term),
        ilike(products.sku, term),
        ilike(products.description, term),
        ilike(products.shortDescription, term),
        sql`${products.tags}::text ilike ${term}`,
      )!,
    );
  }
  if (typeof query.minPrice === "number") {
    filters.push(sql`${effectivePrice} >= ${query.minPrice}`);
  }
  if (typeof query.maxPrice === "number") {
    filters.push(sql`${effectivePrice} <= ${query.maxPrice}`);
  }
  if (query.inStockOnly) filters.push(inStockSql);
  if (query.onSaleOnly) filters.push(saleActive);
  if (query.featuredOnly) filters.push(eq(products.featured, true));

  return filters;
}

/** Paged search for the shop page: items plus the total that matched. */
export async function searchProducts(
  query: ProductQuery = {},
): Promise<{ items: Product[]; total: number }> {
  const filters = await filtersFor(query);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(selection)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...filters))
      .orderBy(...orderFor(query.sort ?? "featured"))
      .limit(query.limit ?? 24)
      .offset(query.offset ?? 0),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(products)
      .where(and(...filters)),
  ]);

  return { items: rows.map((row) => toProduct(row)), total };
}

/** Counts per facet for the filter sidebar. Only active products count. */
export async function shopFacets() {
  const base = and(eq(products.active, true), sql`${products.catalogVisibility} <> 'hidden'`);

  const [cats, surfaces, [bounds], [flags]] = await Promise.all([
    db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        parentId: categories.parentId,
        count: sql<number>`count(distinct ${products.id})::int`,
      })
      .from(categories)
      .leftJoin(productCategories, eq(productCategories.categoryId, categories.id))
      .leftJoin(products, and(eq(products.id, productCategories.productId), base))
      .where(eq(categories.active, true))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ surface: products.surface, count: sql<number>`count(*)::int` })
      .from(products)
      .where(base)
      .groupBy(products.surface)
      .orderBy(asc(products.surface)),
    db
      .select({
        min: sql<number>`coalesce(min(${effectivePrice}), 0)::int`,
        max: sql<number>`coalesce(max(${effectivePrice}), 0)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(products)
      .where(base),
    db
      .select({
        inStock: sql<number>`count(*) filter (where ${inStockSql})::int`,
        onSale: sql<number>`count(*) filter (where ${saleActive})::int`,
        featured: sql<number>`count(*) filter (where ${products.featured})::int`,
      })
      .from(products)
      .where(base),
  ]);

  return {
    categories: cats,
    surfaces,
    price: { min: bounds.min, max: bounds.max },
    total: bounds.total,
    inStock: flags.inStock,
    onSale: flags.onSale,
    featured: flags.featured,
  };
}

export type ShopFacets = Awaited<ReturnType<typeof shopFacets>>;

export async function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  const filters = [eq(products.active, true)];

  if (query.categorySlugs?.length) {
    const ids = await categoryIdsForSlugs(query.categorySlugs);
    filters.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(productCategories)
          .where(
            and(
              eq(productCategories.productId, products.id),
              inArray(productCategories.categoryId, ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
            ),
          ),
      ),
    );
  }
  if (query.surfaces?.length) {
    filters.push(inArray(products.surface, query.surfaces));
  }
  if (query.search?.trim()) {
    const term = `%${query.search.trim()}%`;
    filters.push(
      or(
        ilike(products.name, term),
        ilike(products.sku, term),
        ilike(products.description, term),
      )!,
    );
  }
  if (typeof query.minPrice === "number") {
    filters.push(gte(products.price, query.minPrice));
  }
  if (typeof query.maxPrice === "number") {
    filters.push(lte(products.price, query.maxPrice));
  }
  if (query.inStockOnly) {
    filters.push(
      or(
        and(eq(products.trackStock, false), sql`${products.stockStatus} <> 'outofstock'`),
        and(eq(products.trackStock, true), or(gte(products.stock, 1), sql`${products.backorders} <> 'no'`)),
      )!,
    );
  }

  const rows = await db
    .select(selection)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...filters))
    .orderBy(...orderFor(query.sort ?? "featured"))
    .limit(query.limit ?? 200);

  return rows.map((row) => toProduct(row));
}

export async function getProduct(slug: string): Promise<Product | null> {
  const [row] = await db
    .select(selection)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.active, true)))
    .limit(1);

  return row ? toProduct(row) : null;
}

export type CategoryNode = Category & { productCount: number; children: CategoryNode[] };

export type MenuCategory = { name: string; href: string; note?: string };

/** The shop menu in the header and footer.
 *
 *  Whatever is ticked as "show in menu" in the admin, in sort order. If
 *  nothing is ticked, the first four active top-level categories stand
 *  in, so a fresh shop still has a menu. */
export async function menuCategories(limit = 6): Promise<MenuCategory[]> {
  const rows = await db
    .select({
      name: categories.name,
      href: categories.href,
      blurb: categories.blurb,
      showInMenu: categories.showInMenu,
      parentId: categories.parentId,
    })
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  const chosen = rows.filter((row) => row.showInMenu);
  const fallback = rows.filter((row) => row.parentId === null).slice(0, 4);

  return (chosen.length ? chosen : fallback).slice(0, limit).map((row) => ({
    name: row.name,
    href: row.href,
    note: row.blurb ?? undefined,
  }));
}

/** Every active category, flat, with a live product count. Pass
 *  `{ topLevelOnly: true }` for the range cards on the home page. */
export async function listCategories(
  options: { topLevelOnly?: boolean } = {},
): Promise<(Category & { productCount: number })[]> {
  const rows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      blurb: categories.blurb,
      href: categories.href,
      image: categories.image,
      parentId: categories.parentId,
      productCount: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(categories)
    .leftJoin(productCategories, eq(productCategories.categoryId, categories.id))
    .leftJoin(
      products,
      and(eq(products.id, productCategories.productId), eq(products.active, true)),
    )
    .where(
      options.topLevelOnly
        ? and(eq(categories.active, true), sql`${categories.parentId} is null`)
        : eq(categories.active, true),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows;
}

/** The same list arranged as a tree, for nested navigation and filters. */
export async function categoryTree(): Promise<CategoryNode[]> {
  const flat = await listCategories();
  const byId = new Map<string, CategoryNode>(
    flat.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function getCategory(slug: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row ?? null;
}

/** The distinct surfaces present in the catalogue, for the shop filters. */
export async function listSurfaces(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ surface: products.surface })
    .from(products)
    .where(eq(products.active, true))
    .orderBy(asc(products.surface));
  return rows.map((r) => r.surface);
}

export async function priceBounds(): Promise<{ min: number; max: number }> {
  const [row] = await db
    .select({
      min: sql<number>`coalesce(min(${products.price}), 0)::int`,
      max: sql<number>`coalesce(max(${products.price}), 0)::int`,
    })
    .from(products)
    .where(eq(products.active, true));
  return row ?? { min: 0, max: 0 };
}
