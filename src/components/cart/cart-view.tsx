"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/shop-config";

export function CartView() {
  const { items, subtotal, setQuantity, remove, clear, ready } = useCart();

  if (!ready) {
    return <p className="label py-20 text-muted-foreground">Loading your cart…</p>;
  }

  if (!items.length) {
    return (
      <div className="border-t border-foreground py-20">
        <p className="display text-4xl">Your cart is empty</p>
        <Link
          href="/automotive-ceramic-coating"
          className="label mt-8 inline-block border-b border-primary pb-1"
        >
          Browse the range →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-16 border-t border-foreground pt-10 lg:grid-cols-12">
      <ul className="divide-y divide-border lg:col-span-7">
        {items.map((line) => (
          <li key={line.slug} className="flex flex-wrap gap-6 py-8">
            <Link href={`/products/${line.slug}`} className="bg-background">
              <Image
                src={line.image ?? "/products/_placeholder.webp"}
                alt={line.name}
                width={240}
                height={240}
                className="h-32 w-32 object-contain"
              />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <Link
                  href={`/products/${line.slug}`}
                  className="display-tight text-xl transition-colors hover:text-primary"
                >
                  {line.name}
                </Link>
                <span className="font-mono">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </div>
              <p className="label mt-3 text-muted-foreground">
                {line.sku}
                {line.size ? ` · ${line.size}` : ""} ·{" "}
                {formatPrice(line.price)} each
              </p>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center border border-border">
                  <button
                    type="button"
                    aria-label={`Reduce ${line.name} quantity`}
                    onClick={() => setQuantity(line.slug, line.quantity - 1)}
                    className="px-4 py-2 text-foreground/75 transition-colors hover:text-foreground"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center font-mono text-sm">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${line.name} quantity`}
                    onClick={() => setQuantity(line.slug, line.quantity + 1)}
                    className="px-4 py-2 text-foreground/75 transition-colors hover:text-foreground"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.slug)}
                  className="label text-muted-foreground transition-colors hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="pt-2">
          <div className="flex items-baseline justify-between">
            <span className="label text-muted-foreground">Subtotal</span>
            <span className="display text-3xl">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-3 text-sm text-foreground/75">
            Shipping and tax are calculated at checkout.
          </p>

          <Link
              href="/checkout"
              className="label group relative mt-8 flex w-full items-center justify-center gap-3 overflow-hidden bg-foreground px-6 py-5 text-background transition-colors hover:text-primary-foreground"
            >
              <span
                aria-hidden
                className="absolute inset-0 translate-y-full bg-primary transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
            <span className="relative">Proceed to checkout</span>
          </Link>

          <button
            type="button"
            onClick={clear}
            className="label mt-6 text-muted-foreground transition-colors hover:text-foreground"
          >
            Empty cart
          </button>
        </div>
      </aside>
    </div>
  );
}
