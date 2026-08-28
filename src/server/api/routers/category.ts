import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { categories, productCategories, products } from "@/db/schema";
import { adminProcedure, createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import { categoryInput } from "@/server/api/schemas";

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

const conflict = () =>
  new TRPCError({
    code: "CONFLICT",
    message: "Could not save. Is that slug already in use?",
  });

/** Every category id underneath `id`, however deep. Used to stop a
 *  category being moved inside one of its own descendants. */
async function descendantIds(
  db: Parameters<Parameters<typeof adminProcedure.query>[0]>[0]["ctx"]["db"],
  id: string,
) {
  const rows = await db.execute<{ id: string }>(sql`
    with recursive tree as (
      select id from categories where parent_id = ${id}
      union all
      select c.id from categories c join tree on c.parent_id = tree.id
    )
    select id from tree
  `);
  return rows.map((row) => row.id);
}

export const categoryRouter = createTRPCRouter({
  /** Flat list; the client turns it into a tree. Product counts include
   *  products that list the category as a secondary one. */
  list: permissionProcedure("products.view").query(async ({ ctx }) =>
    ctx.db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        href: categories.href,
        blurb: categories.blurb,
        image: categories.image,
        displayType: categories.displayType,
        showInMenu: categories.showInMenu,
        sortOrder: categories.sortOrder,
        active: categories.active,
        productCount: sql<number>`count(distinct ${productCategories.productId})::int`,
      })
      .from(categories)
      .leftJoin(productCategories, eq(productCategories.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
  ),

  create: permissionProcedure("categories.edit").input(categoryInput).mutation(async ({ ctx, input }) => {
    try {
      const [row] = await ctx.db.insert(categories).values(input).returning({ id: categories.id });
      refresh();
      return row;
    } catch {
      throw conflict();
    }
  }),

  update: permissionProcedure("categories.edit")
    .input(categoryInput.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...values } = input;

      if (values.parentId === id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A category cannot be its own parent.",
        });
      }
      if (values.parentId) {
        const below = await descendantIds(ctx.db, id);
        if (below.includes(values.parentId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That would put the category inside one of its own sub-categories.",
          });
        }
      }

      try {
        await ctx.db
          .update(categories)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(categories.id, id));
      } catch {
        throw conflict();
      }
      refresh();
      return { ok: true };
    }),

  /** Sub-categories move up to the deleted category's parent, the way
   *  WordPress does it. Products whose *primary* category this is block
   *  the delete. */
  delete: permissionProcedure("categories.edit")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select({ parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, input.id))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      const [{ primary }] = await ctx.db
        .select({ primary: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.categoryId, input.id));
      if (primary > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `${primary} ${primary === 1 ? "product uses" : "products use"} this as their primary category. Move them first.`,
        });
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(categories)
          .set({ parentId: target.parentId, updatedAt: new Date() })
          .where(eq(categories.parentId, input.id));
        await tx.delete(categories).where(eq(categories.id, input.id));
      });
      refresh();
      return { ok: true };
    }),

  /** Reorders one sibling group. `ids` is the full ordered list. */
  reorder: permissionProcedure("categories.edit")
    .input(
      z.object({
        parentId: z.string().uuid().nullable(),
        ids: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.ids.entries()) {
          await tx
            .update(categories)
            .set({ sortOrder: index, updatedAt: new Date() })
            .where(
              and(
                eq(categories.id, id),
                input.parentId
                  ? eq(categories.parentId, input.parentId)
                  : sql`${categories.parentId} is null`,
              ),
            );
        }
      });
      refresh();
      return { ok: true };
    }),

  /** Move a category under a new parent (or to the top level). */
  move: permissionProcedure("categories.edit")
    .input(z.object({ id: z.string().uuid(), parentId: z.string().uuid().nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (input.parentId === input.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A category cannot be its own parent." });
      }
      if (input.parentId) {
        const below = await descendantIds(ctx.db, input.id);
        if (below.includes(input.parentId)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "That would put the category inside one of its own sub-categories.",
          });
        }
      }
      await ctx.db
        .update(categories)
        .set({ parentId: input.parentId, updatedAt: new Date() })
        .where(eq(categories.id, input.id));
      refresh();
      return { ok: true };
    }),

  setActive: permissionProcedure("categories.edit")
    .input(z.object({ ids: z.array(z.string().uuid()).min(1), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(categories)
        .set({ active: input.active, updatedAt: new Date() })
        .where(inArray(categories.id, input.ids));
      refresh();
      return { ok: true };
    }),
});
