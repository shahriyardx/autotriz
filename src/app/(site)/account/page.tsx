import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerAddresses, orders } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-guard";
import { formatPrice } from "@/lib/shop-config";
import { OrderStatusPill } from "@/components/account/order-status-pill";

export const metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const account = await requireCustomer("/account");

  const [recent, addressCount] = await Promise.all([
    db
      .select({
        number: orders.number,
        status: orders.status,
        total: orders.total,
        placedAt: orders.placedAt,
      })
      .from(orders)
      .where(eq(orders.userId, account.id))
      .orderBy(desc(orders.placedAt))
      .limit(5),
    db
      .select({ id: customerAddresses.id })
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, account.id)),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="display text-2xl">Hello, {account.name.split(" ")[0]}</h1>
        <p className="mt-2 text-foreground/75">
          Your orders, your addresses and your details, all in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Orders" value={String(recent.length)} href="/account/orders" />
        <Tile label="Saved addresses" value={String(addressCount.length)} href="/account/addresses" />
        <Tile label="My details" value="Edit" href="/account/details" />
      </div>

      <section>
        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <h2 className="display text-lg">Recent orders</h2>
          <Link href="/account/orders" className="label text-muted-foreground hover:text-foreground">
            View all
          </Link>
        </div>

        {recent.length ? (
          <ul className="divide-y divide-border">
            {recent.map((order) => (
              <li key={order.number} className="flex flex-wrap items-center gap-4 py-4">
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
                <span className="ml-auto tabular-nums">{formatPrice(order.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 text-foreground/75">
            No orders yet.{" "}
            <Link href="/shop" className="underline decoration-primary underline-offset-4">
              Browse the range
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link
      href={href}
      className="block border border-border p-6 transition-colors hover:border-primary"
    >
      <p className="label text-muted-foreground">{label}</p>
      <p className="display mt-3 text-xl">{value}</p>
    </Link>
  );
}
