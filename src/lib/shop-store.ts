import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import {
  SHOP_SETTINGS_KEY,
  mergeShopSettings,
  type ShopSettings,
} from "@/lib/shop-settings";

/** The storefront's read side for shop settings. */
export async function getShopSettings(): Promise<ShopSettings> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, SHOP_SETTINGS_KEY))
    .limit(1);

  return mergeShopSettings(row?.value);
}
