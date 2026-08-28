"use client";

import { useCart } from "@/components/cart/cart-context";

export function CartButton({ className }: { className?: string }) {
  const { count, setOpen, ready } = useCart();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={className}
      aria-label={`Open cart${ready && count ? `, ${count} items` : ""}`}
    >
      Cart
      <span className="ml-2 inline-block min-w-4 text-primary">
        {ready && count ? `(${count})` : ""}
      </span>
    </button>
  );
}
