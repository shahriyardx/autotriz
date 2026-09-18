import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { discounts } from "@/db/schema";
import { createTRPCRouter, permissionProcedure, publicProcedure } from "@/server/api/trpc";
import {
  discountInput,
  evaluateDiscount,
  normaliseCode,
  type DiscountRule,
} from "@/lib/discounts";

/* ==================================================================
   Discount codes: managed here, checked here, and checked again when
   the order is placed. The browser is told what a code is worth so it
   can show a total, and is believed about nothing.
   ================================================================== */

/** The stored row, in the shape the rules expect. `value` is numeric in
 *  Postgres, which comes back as a string. */
export function toRule(row: typeof discounts.$inferSelect): DiscountRule {
  return {
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minSubtotal: row.minSubtotal,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    active: row.active,
  };
}

/** Taka in the form, minor units in the database — except a
 *  percentage, which is a percentage either way. */
const storedValue = (type: "percent" | "fixed", value: number) =>
  type === "percent" ? value : Math.round(value * 100);

const date = (value: string | null) => (value ? new Date(value) : null);

export const discountRouter = createTRPCRouter({
  list: permissionProcedure("discounts.edit").query(({ ctx }) =>
    ctx.db.select().from(discounts).orderBy(desc(discounts.createdAt)),
  ),

  create: permissionProcedure("discounts.edit")
    .input(discountInput)
    .mutation(async ({ ctx, input }) => {
      const code = normaliseCode(input.code);

      const [clash] = await ctx.db
        .select({ id: discounts.id })
        .from(discounts)
        .where(eq(discounts.code, code))
        .limit(1);
      if (clash) {
        throw new TRPCError({ code: "CONFLICT", message: "That code already exists." });
      }

      await ctx.db.insert(discounts).values({
        code,
        type: input.type,
        value: String(storedValue(input.type, input.value)),
        minSubtotal: Math.round(input.minSubtotal * 100),
        usageLimit: input.usageLimit,
        startsAt: date(input.startsAt),
        endsAt: date(input.endsAt),
        active: input.active,
      });

      revalidatePath("/admin/discounts");
      return { ok: true };
    }),

  update: permissionProcedure("discounts.edit")
    .input(discountInput.extend({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const code = normaliseCode(input.code);

      const [clash] = await ctx.db
        .select({ id: discounts.id })
        .from(discounts)
        .where(eq(discounts.code, code))
        .limit(1);
      if (clash && clash.id !== input.id) {
        throw new TRPCError({ code: "CONFLICT", message: "Another code already uses that name." });
      }

      await ctx.db
        .update(discounts)
        .set({
          code,
          type: input.type,
          value: String(storedValue(input.type, input.value)),
          minSubtotal: Math.round(input.minSubtotal * 100),
          usageLimit: input.usageLimit,
          startsAt: date(input.startsAt),
          endsAt: date(input.endsAt),
          active: input.active,
        })
        .where(eq(discounts.id, input.id));

      revalidatePath("/admin/discounts");
      return { ok: true };
    }),

  setActive: permissionProcedure("discounts.edit")
    .input(z.object({ id: z.uuid(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(discounts)
        .set({ active: input.active })
        .where(eq(discounts.id, input.id));
      revalidatePath("/admin/discounts");
      return { ok: true };
    }),

  remove: permissionProcedure("discounts.edit")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(discounts).where(eq(discounts.id, input.id));
      revalidatePath("/admin/discounts");
      return { ok: true };
    }),

  /** What the checkout asks so it can show a total. Public, and worth
   *  nothing on its own: the order is priced again when it is placed. */
  check: publicProcedure
    .input(z.object({ code: z.string().trim().min(1), subtotal: z.number().int().min(0) }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(discounts)
        .where(eq(discounts.code, normaliseCode(input.code)))
        .limit(1);

      return evaluateDiscount(row ? toRule(row) : null, input.subtotal);
    }),
});
