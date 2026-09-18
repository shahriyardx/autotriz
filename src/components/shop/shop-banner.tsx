import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/shop-config";
import type { Product } from "@/lib/catalogue";

/* ==================================================================
   THE SHOP BANNER

   The top of the shop: the range on the left, three products priced
   on the right. Which three is an admin decision — whatever is ticked
   as featured — so this is a shop window that can be redressed
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

        {products.length ? (
          <ul className="grid grid-cols-3 gap-3 sm:gap-4">
            {products.map((product) => (
              <li key={product.id}>
                <BannerProduct product={product} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   One product in the banner. Deliberately smaller than a card in the
   grid below — a taste of the range, not a second catalogue.
   ------------------------------------------------------------------ */

function BannerProduct({ product }: { product: Product }) {
  const onSale =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col border border-foreground/12 bg-background/40 transition-colors hover:border-primary"
    >
      <span className="relative block aspect-square overflow-hidden bg-foreground/5">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={600}
            height={600}
            sizes="(min-width: 1024px) 15vw, 30vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        ) : (
          <span className="label absolute inset-0 flex items-center justify-center text-muted-foreground">
            No image
          </span>
        )}

        {onSale ? (
          <span className="label absolute left-2 top-2 bg-primary px-1.5 py-1 text-primary-foreground">
            Sale
          </span>
        ) : null}
      </span>

      <span className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="display-tight line-clamp-2 text-xs leading-snug text-foreground transition-colors group-hover:text-primary sm:text-sm">
          {product.name}
        </span>

        <span className="mt-auto flex flex-wrap items-baseline gap-2">
          <span className="display text-sm text-primary sm:text-base">
            {formatPrice(product.price)}
          </span>
          {onSale && product.compareAtPrice !== null ? (
            <span className="text-xs text-foreground/40 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
