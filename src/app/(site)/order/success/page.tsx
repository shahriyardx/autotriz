import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default function OrderSuccessPage() {
  return (
    <>
      <ClearCartOnMount />
      <section className="relative overflow-hidden bg-background py-32 md:py-40">
        
        <div className="shell relative">
          <p className="label text-muted-foreground">Order received</p>
          <h1 className="display mt-6 text-[clamp(2.25rem,6vw,4.5rem)]">
            Thank you
          </h1>
          <p className="lede mt-10 max-w-lg">
            A confirmation is on its way to your inbox with the order number and
            the tracking details once the parcel leaves us.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button href="/automotive-ceramic-coating">Keep shopping</Button>
            <Button href="/contact" variant="outline">
              Question about the order
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
