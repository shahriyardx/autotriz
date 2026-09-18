import { desc } from "drizzle-orm";
import { db } from "@/db";
import { discounts } from "@/db/schema";
import { DiscountManager } from "@/components/admin/discount-manager";
import { requirePermission } from "@/lib/admin-guard";

export const metadata = { title: "Discounts" };

export default async function AdminDiscountsPage() {
  await requirePermission("discounts.edit");

  /* Read here so the table is on the page in the first response; the
     manager refetches the same query for anything it changes. */
  const rows = await db.select().from(discounts).orderBy(desc(discounts.createdAt));

  return <DiscountManager initial={rows} />;
}
