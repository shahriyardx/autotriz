import { ShopBannerProducts } from "@/components/shop/shop-banner-products";
import { Button } from "@/components/ui";
import type { Product } from "@/lib/catalogue";

/* ==================================================================
   THE SHOP BANNER

   The top of the shop: the range on the left, featured products
   priced on the right. Which ones is an admin decision — whatever is
   ticked as featured — so this is a shop window that can be redressed
   without a deploy.
   ================================================================== */

export function ShopBanner({
  title,
  accent,
  subhead,
  lede,
  products,
}: {
  title: string;
  accent?: string;
  subhead?: string;
  lede?: string;
  products: Product[];
}) {
  return (
    <section className="dark relative isolate overflow-hidden bg-card">
      {/* A pool of light behind the products, so the band is not flat. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_78%_50%,rgba(255,255,255,0.05),transparent_70%)]"
      />

      <div className="shell relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          {subhead ? <p className="label text-primary">{subhead}</p> : null}

          <h1 className="display mt-4 text-[clamp(2rem,4.4vw,3.25rem)] text-foreground">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="accent">{accent}</span>
              </>
            ) : null}
          </h1>

          {lede ? (
            <p className="lede mt-6 max-w-lg text-foreground/70">{lede}</p>
          ) : null}

          <div className="mt-9 flex flex-wrap gap-3">
            <Button href="#products">Browse the range</Button>
            <Button href="/contact" variant="outline-light">
              Talk to us
            </Button>
          </div>
        </div>

        <ShopBannerProducts products={products} />
      </div>
    </section>
  );
}
