import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { pageContent } from "@/db/schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import { PAGES, PAGE_DEFAULTS, PAGE_KEYS, findPage, mergeContent } from "@/lib/page-content";

/* Editable copy for the fixed storefront pages. The definitions live in
   `page-content.ts`; this only stores and returns the values. */

const pageKey = z.enum(PAGE_KEYS as [string, ...string[]]);

export const pageRouter = createTRPCRouter({
  list: permissionProcedure("pages.edit").query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ page: pageContent.page, updatedAt: pageContent.updatedAt, updatedBy: pageContent.updatedBy })
      .from(pageContent);

    return PAGES.map((page) => {
      const row = rows.find((r) => r.page === page.key);
      return {
        key: page.key,
        name: page.name,
        path: page.path,
        description: page.description,
        edited: Boolean(row),
        updatedAt: row?.updatedAt ?? null,
        updatedBy: row?.updatedBy ?? null,
      };
    });
  }),

  get: permissionProcedure("pages.edit")
    .input(z.object({ page: pageKey }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ content: pageContent.content })
        .from(pageContent)
        .where(eq(pageContent.page, input.page))
        .limit(1);

      // The form edits the merged result, so every field starts filled.
      return {
        page: input.page,
        content: mergeContent(PAGE_DEFAULTS[input.page] ?? {}, row?.content),
      };
    }),

  update: permissionProcedure("pages.edit")
    .input(z.object({ page: pageKey, content: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(pageContent)
        .values({
          page: input.page,
          content: input.content,
          updatedBy: ctx.user.email,
        })
        .onConflictDoUpdate({
          target: pageContent.page,
          set: { content: input.content, updatedBy: ctx.user.email, updatedAt: new Date() },
        });

      const def = findPage(input.page);
      if (def) revalidatePath(def.path);
      revalidatePath("/admin/pages");
      return { ok: true };
    }),

  /** Puts a page back to the copy the site shipped with. */
  reset: permissionProcedure("pages.edit")
    .input(z.object({ page: pageKey }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(pageContent).where(eq(pageContent.page, input.page));
      const def = findPage(input.page);
      if (def) revalidatePath(def.path);
      revalidatePath("/admin/pages");
      return { ok: true };
    }),
});
