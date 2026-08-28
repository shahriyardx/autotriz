import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { enquiries } from "@/db/schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";

export const enquiryRouter = createTRPCRouter({
  list: permissionProcedure("enquiries.view").query(async ({ ctx }) =>
    ctx.db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(200),
  ),

  setHandled: permissionProcedure("enquiries.edit")
    .input(z.object({ id: z.string().uuid(), handled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(enquiries)
        .set({ handled: input.handled })
        .where(eq(enquiries.id, input.id));

      revalidatePath("/admin/enquiries");
      return { ok: true };
    }),
});
