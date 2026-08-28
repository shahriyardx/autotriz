import { desc } from "drizzle-orm";
import { db } from "@/db";
import { discounts } from "@/db/schema";
import { requirePermission } from "@/lib/admin-guard";

export const metadata = { title: "Discounts" };

export default async function AdminDiscountsPage() {
  await requirePermission("discounts.edit");
  const rows = await db.select().from(discounts).orderBy(desc(discounts.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Discounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} discount {rows.length === 1 ? "code" : "codes"}
        </p>
      </div>

      <div className="rounded-lg border bg-background p-10 text-center">
        <p className="text-sm text-muted-foreground">
          The discounts table exists and is ready. Creating codes and applying
          them at checkout is the next piece of work — it needs the Stripe
          checkout flow live first, so a code has something to discount.
        </p>
      </div>
    </div>
  );
}
