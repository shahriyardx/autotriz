"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-context";

/** Empties the cart once the customer lands on the confirmation page. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
