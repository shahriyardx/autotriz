"use client";

import { useState } from "react";
import { useCart, type AddableProduct } from "@/components/cart/cart-context";
import { cn } from "@/lib/cn";

export function AddToCart({
  product,
  disabled,
  className,
}: {
  product: AddableProduct;
  disabled?: boolean;
  className?: string;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={cn("flex flex-wrap items-stretch gap-4", className)}>
      <div className="flex items-center border border-foreground">
        <button
          type="button"
          aria-label="Reduce quantity"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-4 py-4 text-foreground/75 transition-colors hover:text-foreground"
        >
          −
        </button>
        <span className="min-w-10 text-center font-medium text-foreground">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          className="px-4 py-4 text-foreground/75 transition-colors hover:text-foreground"
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => add(product, quantity)}
        className="label group relative inline-flex flex-1 items-center justify-center gap-3 overflow-hidden rounded-sm bg-foreground px-8 py-4 text-background transition-colors hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
      >
        <span
          aria-hidden
          className="absolute inset-0 translate-y-full bg-primary transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-disabled:translate-y-full"
        />
        <span className="relative">
          {disabled ? "Out of stock" : "Add to cart"}
        </span>
      </button>
    </div>
  );
}

/** Compact variant used on product cards in the grid. */
export function QuickAdd({
  product,
  disabled,
}: {
  product: AddableProduct;
  disabled?: boolean;
}) {
  const { add } = useCart();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add(product, 1);
      }}
      className="label w-full rounded-sm bg-foreground px-4 py-3 text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
    >
      {disabled ? "Out of stock" : "Add to cart"}
    </button>
  );
}
