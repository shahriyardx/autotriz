import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { orderItems, orders } from "@/db/schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import { orderStatusInput } from "@/server/api/schemas";

export const orderRouter = createTRPCRouter({
  list: permissionProcedure("orders.view")
    .input(z.object({ status: orderStatusInput.optional() }).optional())
    .query(async ({ ctx, input }) =>
      ctx.db
        .select()
        .from(orders)
        .where(input?.status ? eq(orders.status, input.status) : undefined)
        .orderBy(desc(orders.placedAt))
        .limit(200),
    ),

  byId: permissionProcedure("orders.view")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const items = await ctx.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return { order, items };
    }),

  setStatus: permissionProcedure("orders.edit")
    .input(z.object({ id: z.string().uuid(), status: orderStatusInput }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(orders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(orders.id, input.id));

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${input.id}`);
      return { ok: true };
    }),
});
