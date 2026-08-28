import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requirePermission } from "@/lib/admin-guard";
import { formatPrice } from "@/lib/shop-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit/card";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("orders.view");
  const { id } = await params;

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Orders
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {order.number}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {order.placedAt.toLocaleString("en-GB")}
          </p>
        </div>
        <OrderStatusSelect id={order.id} status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.sku} · {formatPrice(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <p className="tabular-nums">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}

            <dl className="space-y-2 pt-4 text-sm">
              {[
                ["Subtotal", order.subtotal],
                ["Shipping", order.shipping],
                ["Tax", order.tax],
                ...(order.discount ? ([["Discount", -order.discount]] as const) : []),
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="tabular-nums">{formatPrice(value as number)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customerName ?? "—"}</p>
              <p className="text-muted-foreground">{order.email}</p>
              {order.phone ? (
                <p className="text-muted-foreground">{order.phone}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {address ? (
                <address className="not-italic">
                  {address.line1}
                  <br />
                  {address.line2 ? (
                    <>
                      {address.line2}
                      <br />
                    </>
                  ) : null}
                  {address.city}
                  {address.region ? `, ${address.region}` : ""}
                  <br />
                  {address.postcode}
                  <br />
                  {address.country}
                </address>
              ) : (
                <p>No address recorded.</p>
              )}
            </CardContent>
          </Card>

          {order.stripeSessionId ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                <p className="break-all">Session: {order.stripeSessionId}</p>
                {order.stripePaymentIntentId ? (
                  <p className="break-all">
                    Intent: {order.stripePaymentIntentId}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
