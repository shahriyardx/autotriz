import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-guard";
import { OrderSummary } from "@/components/checkout/order-summary";

export const metadata = { title: "Order", robots: { index: false } };

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const account = await requireCustomer(`/account/orders/${number}`);

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.number, number.toUpperCase()), eq(orders.userId, account.id)))
    .limit(1);

  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <div className="space-y-8">
      <Link
        href="/account/orders"
        className="label inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        All orders
      </Link>

      <OrderSummary order={order} items={items} />
    </div>
  );
}
