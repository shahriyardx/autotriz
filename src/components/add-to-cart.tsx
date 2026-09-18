"use client";

import { useState } from "react";
import { useCart, type AddableProduct } from "@/components/cart/cart-context";
import { Button } from "@/components/ui";
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

      <Button
        variant="solid"
        onClick={() => add(product, quantity)}
        disabled={disabled}
        className="flex-1 sm:flex-none"
      >
        {disabled ? "Out of stock" : "Add to cart"}
      </Button>
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
    <Button
      variant="solid"
      size="sm"
      disabled={disabled}
      onClick={(event) => {
        // The whole card is a link to the product.
        event.preventDefault();
        event.stopPropagation();
        add(product, 1);
      }}
      className="w-full"
    >
      {disabled ? "Out of stock" : "Add to cart"}
    </Button>
  );
}
