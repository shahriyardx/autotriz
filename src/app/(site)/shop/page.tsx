import type { Metadata } from "next";
import { Newsletter } from "@/components/newsletter";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductBanner } from "@/components/shop/product-banner";
import { Band } from "@/components/ui";
import { listProducts } from "@/lib/catalogue";
import { getPage } from "@/lib/page-store";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "The full AUTOTRIZ automotive range: ceramic coatings, polishing compounds, surface preparation and after care.",
};

/** The whole range on one page.
 *
 *  There is no filtering sidebar. The catalogue is small enough that a
 *  shopper can see all of it at once, and a set of filters over a
 *  dozen products is furniture rather than help. */
export default async function ShopPage() {
  const [products, featured] = await Promise.all([
    listProducts(),
    listProducts({ featuredOnly: true }),
  ]);

  const page = getPage("shop");

  /* Every featured product goes in the banner, and it slides once
     there are more than three. Below three, the front of the range
     makes the row up rather than leaving it half empty. */
  const banner =
    featured.length >= 3
      ? featured
      : [
          ...featured,
          ...products.filter((p) => !p.featured).slice(0, 3 - featured.length),
        ];

  return (
    <>
      <ProductBanner
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        subhead={page.text("hero.subhead")}
        lede={page.text("hero.lede")}
        products={banner}
      />

      <Band tone="white" className="py-14 md:py-20">
        <div className="shell" id="products">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="display text-[clamp(1.375rem,2.4vw,1.875rem)]">
              All <span className="accent">products</span>
            </h2>
            <p className="label text-muted-foreground">
              {products.length} {products.length === 1 ? "product" : "products"}
            </p>
          </div>
          <span aria-hidden className="mt-6 block h-0.5 w-14 bg-primary" />

          <div className="mt-10">
            {products.length ? (
              <ProductGrid items={products} />
            ) : (
              <p className="py-16 text-center text-foreground/60">
                Nothing in the shop yet. Please check back shortly.
              </p>
            )}
          </div>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
