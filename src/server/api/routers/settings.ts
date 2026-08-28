import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { settings } from "@/db/schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import {
  SHOP_SETTINGS_KEY,
  mergeShopSettings,
  shopSettingsInput,
} from "@/lib/shop-settings";

export const settingsRouter = createTRPCRouter({
  get: permissionProcedure("settings.edit").query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ value: settings.value, updatedAt: settings.updatedAt })
      .from(settings)
      .where(eq(settings.key, SHOP_SETTINGS_KEY))
      .limit(1);

    return {
      settings: mergeShopSettings(row?.value),
      updatedAt: row?.updatedAt ?? null,
    };
  }),

  update: permissionProcedure("settings.edit")
    .input(shopSettingsInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(settings)
        .values({ key: SHOP_SETTINGS_KEY, value: input })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: input, updatedAt: new Date() },
        });

      // The header and footer appear on every page.
      revalidatePath("/", "layout");
      return { ok: true };
    }),

  /** Puts every field back to the value the site shipped with. */
  reset: permissionProcedure("settings.edit").mutation(async ({ ctx }) => {
    await ctx.db.delete(settings).where(eq(settings.key, SHOP_SETTINGS_KEY));
    revalidatePath("/", "layout");
    return { ok: true };
  }),
});
