import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { currentCustomer } from "@/lib/customer-guard";
import { formatPrice } from "@/lib/shop-config";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.number, number.toUpperCase()))
    .limit(1);

  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const account = await currentCustomer();
  const mine = account?.id && order.userId === account.id;

  return (
    <>
      <ClearCartOnMount />
      <section className="shell py-20 md:py-28">
        <p className="label text-muted-foreground">Order received</p>
        <h1 className="display mt-5 text-[clamp(2rem,5vw,3.5rem)]">Thank you</h1>
        <p className="lede mt-6 max-w-xl text-foreground/75">
          Your order is <span className="font-medium text-foreground">{order.number}</span>. A
          confirmation is on its way to {order.email}, and we will be in touch when
          the parcel leaves us.
        </p>

        <div className="mt-12 max-w-2xl">
          <OrderSummary order={order} items={items} />
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button href={mine ? "/account/orders" : "/shop"}>
            {mine ? "My orders" : "Keep shopping"}
          </Button>
          <Button href="/contact" variant="outline">
            Question about the order
          </Button>
        </div>

        {!account ? (
          <p className="mt-10 text-sm text-foreground/75">
            Ordered as a guest. Keep the number {order.number} — you will need it,
            with {order.email}, to ask us about the order. Total paid:{" "}
            {formatPrice(order.total)}.
          </p>
        ) : null}
      </section>
    </>
  );
}
