import { formatPrice } from "@/lib/shop-config";
import type { Address, PaymentMethod, PaymentStatus } from "@/db/schema";

/* The read-only receipt: used on the confirmation page and inside the
   customer's account, so both always agree. */

type Order = {
  number: string;
  status: string;
  email: string;
  phone: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: Address | null;
  notes: string | null;
  placedAt: Date | string;
};

type Item = { id: string; name: string; sku: string; unitPrice: number; quantity: number };

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  bank: "Bank transfer",
  card: "Card payment",
};

export function OrderSummary({ order, items }: { order: Order; items: Item[] }) {
  const address = order.shippingAddress;

  return (
    <div className="border border-border">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <p className="label text-muted-foreground">Order</p>
          <p className="display mt-1 text-lg">{order.number}</p>
        </div>
        <div className="text-right">
          <p className="label text-muted-foreground">Status</p>
          <p className="mt-1 capitalize">{order.status}</p>
        </div>
        <div className="text-right">
          <p className="label text-muted-foreground">Placed</p>
          <p className="mt-1">{new Date(order.placedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-4 px-6 py-4">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{item.name}</span>
              <span className="block text-xs text-muted-foreground">
                {item.sku} · {item.quantity} × {formatPrice(item.unitPrice)}
              </span>
            </span>
            <span className="tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-border px-6 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-foreground/75">Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-foreground/75">Delivery</dt>
          <dd className="tabular-nums">{order.shipping ? formatPrice(order.shipping) : "Free"}</dd>
        </div>
        {order.discount ? (
          <div className="flex justify-between">
            <dt className="text-foreground/75">Discount</dt>
            <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="display text-base">Total</dt>
          <dd className="display text-lg tabular-nums">{formatPrice(order.total)}</dd>
        </div>
      </dl>

      <div className="grid gap-6 border-t border-border px-6 py-5 text-sm sm:grid-cols-2">
        <div>
          <p className="label text-muted-foreground">Delivering to</p>
          {address ? (
            <address className="mt-2 not-italic text-foreground/75">
              {address.name}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.city}
              {address.region ? `, ${address.region}` : ""}
              {address.postcode ? ` ${address.postcode}` : ""}
              <br />
              {address.country}
            </address>
          ) : (
            <p className="mt-2 text-foreground/75">—</p>
          )}
        </div>
        <div>
          <p className="label text-muted-foreground">Payment</p>
          <p className="mt-2 text-foreground/75">
            {PAYMENT_LABELS[order.paymentMethod]}
            <br />
            <span className="capitalize">{order.paymentStatus}</span>
          </p>
          <p className="label mt-5 text-muted-foreground">Contact</p>
          <p className="mt-2 break-all text-foreground/75">
            {order.email}
            {order.phone ? (
              <>
                <br />
                {order.phone}
              </>
            ) : null}
          </p>
        </div>
      </div>

      {order.notes ? (
        <div className="border-t border-border px-6 py-5 text-sm">
          <p className="label text-muted-foreground">Your notes</p>
          <p className="mt-2 text-foreground/75">{order.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
