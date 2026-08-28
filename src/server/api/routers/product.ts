import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, inArray, ne, notInArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { categories, productCategories, products } from "@/db/schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import { productInput } from "@/server/api/schemas";

const toMinorUnits = (value: number) => Math.round(value * 100);

/** Re-renders every storefront surface a product change can affect. */
function refreshStorefront(slug?: string) {
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  if (slug) revalidatePath(`/products/${slug}`);
}

function translateWriteError(error: unknown): never {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("products_slug_idx")) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another product already uses that slug.",
    });
  }
  if (message.includes("products_sku_idx")) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Another product already uses that SKU.",
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Could not save the product.",
  });
}

/** Turns the validated form payload into a `products` row. */
function toRow(input: z.output<typeof productInput>) {
  const { categoryIds, ...rest } = input;
  void categoryIds;
  return {
    ...rest,
    price: toMinorUnits(input.price),
    salePrice: input.salePrice === null ? null : toMinorUnits(input.salePrice),
  };
}

/** Every category the product belongs to: the primary one plus extras. */
const allCategoryIds = (input: { categoryId: string; categoryIds: string[] }) =>
  Array.from(new Set([input.categoryId, ...input.categoryIds]));

export const productRouter = createTRPCRouter({
  list: permissionProcedure("products.view")
    .input(z.object({ search: z.string().trim().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const search = input?.search;

      return ctx.db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          sku: products.sku,
          price: products.price,
          salePrice: products.salePrice,
          stock: products.stock,
          trackStock: products.trackStock,
          active: products.active,
          featured: products.featured,
          image: products.image,
          lowStockAt: products.lowStockAt,
          categoryName: categories.name,
        })
        .from(products)
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .where(
          search
            ? or(
                ilike(products.name, `%${search}%`),
                ilike(products.sku, `%${search}%`),
              )
            : undefined,
        )
        .orderBy(desc(products.active), asc(products.sortOrder), asc(products.name));
    }),

  byId: permissionProcedure("products.view")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const links = await ctx.db
        .select({ categoryId: productCategories.categoryId })
        .from(productCategories)
        .where(eq(productCategories.productId, input.id));

      return { ...row, categoryIds: links.map((l) => l.categoryId) };
    }),

  create: permissionProcedure("products.edit")
    .input(productInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const row = await ctx.db.transaction(async (tx) => {
          const [created] = await tx
            .insert(products)
            .values(toRow(input))
            .returning({ id: products.id, slug: products.slug });

          await tx.insert(productCategories).values(
            allCategoryIds(input).map((categoryId) => ({
              productId: created.id,
              categoryId,
            })),
          );
          return created;
        });

        refreshStorefront(row.slug);
        return row;
      } catch (error) {
        translateWriteError(error);
      }
    }),

  update: permissionProcedure("products.edit")
    .input(productInput.safeExtend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;

      try {
        const row = await ctx.db.transaction(async (tx) => {
          const [updated] = await tx
            .update(products)
            .set({
              ...toRow(values),
              upsellIds: values.upsellIds.filter((other) => other !== id),
              crossSellIds: values.crossSellIds.filter((other) => other !== id),
              updatedAt: new Date(),
            })
            .where(eq(products.id, id))
            .returning({ id: products.id, slug: products.slug });

          if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

          const wanted = allCategoryIds(values);
          await tx
            .delete(productCategories)
            .where(
              and(
                eq(productCategories.productId, id),
                notInArray(productCategories.categoryId, wanted),
              ),
            );
          await tx
            .insert(productCategories)
            .values(wanted.map((categoryId) => ({ productId: id, categoryId })))
            .onConflictDoNothing();

          return updated;
        });

        refreshStorefront(row.slug);
        return row;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        translateWriteError(error);
      }
    }),

  setActive: permissionProcedure("products.edit")
    .input(z.object({ id: z.string().uuid(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .update(products)
        .set({ active: input.active, updatedAt: new Date() })
        .where(eq(products.id, input.id))
        .returning({ slug: products.slug });

      refreshStorefront(row?.slug);
      return { ok: true };
    }),

  setStock: permissionProcedure("products.edit")
    .input(z.object({ id: z.string().uuid(), stock: z.coerce.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(products)
        .set({ stock: input.stock, updatedAt: new Date() })
        .where(eq(products.id, input.id));

      refreshStorefront();
      return { ok: true };
    }),

  delete: permissionProcedure("products.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .delete(products)
        .where(eq(products.id, input.id))
        .returning({ slug: products.slug });

      refreshStorefront(row?.slug);
      return { ok: true };
    }),

  /** Feeds the category tree picker on the product form. */
  categoryOptions: permissionProcedure("products.view").query(async ({ ctx }) =>
    ctx.db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        active: categories.active,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
  ),

  /** Search box for upsells and cross-sells. */
  linkOptions: permissionProcedure("products.view")
    .input(
      z.object({
        search: z.string().trim().default(""),
        exclude: z.string().uuid().optional(),
        ids: z.array(z.string().uuid()).default([]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters = [];
      if (input.exclude) filters.push(ne(products.id, input.exclude));
      if (input.ids.length) {
        filters.push(inArray(products.id, input.ids));
      } else if (input.search) {
        filters.push(
          or(ilike(products.name, `%${input.search}%`), ilike(products.sku, `%${input.search}%`))!,
        );
      }
      return ctx.db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          image: products.image,
        })
        .from(products)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(asc(products.name))
        .limit(input.ids.length ? input.ids.length : 12);
    }),

  /** Distinct tags already in use, for autocomplete. */
  tagOptions: permissionProcedure("products.view").query(async ({ ctx }) => {
    const rows = await ctx.db.execute<{ tag: string }>(
      sql`select distinct jsonb_array_elements_text(${products.tags}) as tag from ${products} order by tag`,
    );
    return rows.map((r) => r.tag);
  }),
});
