"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/shop-config";
import { cn } from "@/lib/cn";

export function CartDrawer() {
  const { items, subtotal, count, open, setOpen, setQuantity, remove } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Close cart"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-60 bg-black/40 backdrop-blur-sm transition-opacity duration-400",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Cart"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-70 flex w-full max-w-md flex-col bg-background transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-6 py-6">
          <p className="label">
            Cart {count ? <span className="text-muted-foreground">/ {count}</span> : null}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="label text-muted-foreground transition-colors hover:text-foreground"
          >
            Close
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-6 px-6">
            <p className="display text-3xl">Nothing in here yet</p>
            <Link
              href="/automotive-ceramic-coating"
              onClick={() => setOpen(false)}
              className="label border-b border-primary pb-1"
            >
              Browse the range →
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
            {items.map((line) => (
              <li key={line.slug} className="flex gap-5 py-6">
                <Link
                  href={`/products/${line.slug}`}
                  onClick={() => setOpen(false)}
                  className="shrink-0 bg-background"
                >
                  <Image
                    src={line.image ?? "/products/_placeholder.webp"}
                    alt={line.name}
                    width={160}
                    height={160}
                    className="h-24 w-24 object-contain"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="display-tight truncate text-base">
                      {line.name}
                    </p>
                    <p className="font-mono text-sm">
                      {formatPrice(line.price * line.quantity)}
                    </p>
                  </div>
                  <p className="label mt-2 text-muted-foreground">
                    {line.sku}
                    {line.size ? ` · ${line.size}` : ""}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        aria-label={`Reduce ${line.name} quantity`}
                        onClick={() => setQuantity(line.slug, line.quantity - 1)}
                        className="px-3 py-1.5 text-foreground/75 transition-colors hover:text-foreground"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center font-mono text-sm">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase ${line.name} quantity`}
                        onClick={() => setQuantity(line.slug, line.quantity + 1)}
                        className="px-3 py-1.5 text-foreground/75 transition-colors hover:text-foreground"
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
        )}

        {items.length > 0 ? (
          <footer className="border-t border-border px-6 py-6">
            <div className="flex items-baseline justify-between">
              <span className="label text-muted-foreground">Subtotal</span>
              <span className="display text-2xl">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Shipping and tax are calculated at checkout.
            </p>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="label group relative mt-6 flex items-center justify-center gap-3 overflow-hidden bg-foreground px-6 py-5 text-background transition-colors hover:text-primary-foreground"
            >
              <span
                aria-hidden
                className="absolute inset-0 translate-y-full bg-primary transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative">Review and check out</span>
            </Link>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
