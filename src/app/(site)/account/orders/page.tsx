import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-guard";
import { formatPrice } from "@/lib/shop-config";
import { OrderStatusPill } from "@/components/account/order-status-pill";

export const metadata = { title: "My orders", robots: { index: false } };

export default async function AccountOrdersPage() {
  const account = await requireCustomer("/account/orders");

  const rows = await db
    .select({
      number: orders.number,
      status: orders.status,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(eq(orders.userId, account.id))
    .orderBy(desc(orders.placedAt));

  return (
    <div className="space-y-8">
      <h1 className="display text-2xl">Orders</h1>

      {rows.length ? (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((order) => (
            <li key={order.number} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-5">
              <Link
                href={`/account/orders/${order.number}`}
                className="font-medium hover:text-primary"
              >
                {order.number}
              </Link>
              <OrderStatusPill status={order.status} />
              <span className="text-sm text-muted-foreground">
                {new Date(order.placedAt).toLocaleDateString()}
              </span>
              <span className="text-sm capitalize text-muted-foreground">
                {order.paymentStatus}
              </span>
              <span className="ml-auto tabular-nums">{formatPrice(order.total)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground/75">
          No orders yet.{" "}
          <Link href="/shop" className="underline decoration-primary underline-offset-4">
            Browse the range
          </Link>
          .
        </p>
      )}
    </div>
  );
}
