import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your AUTOTRIZ order before checkout.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <PageHero title="Your" accent="cart" />
      <div className="shell py-20 md:py-24">
        <CartView />
      </div>
    </>
  );
}
