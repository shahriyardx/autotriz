import Image from "next/image";
import { ShopBannerProducts } from "@/components/shop/shop-banner-products";
import { Button } from "@/components/ui";
import type { Product } from "@/lib/catalogue";

/* ==================================================================
   A BANNER WITH PRODUCTS IN IT

   Copy on the left, featured products priced on the right. Used at
   the top of the shop and at the top of each service, so a page about
   fitting film also puts the chemistry it is fitted with in front of
   whoever is reading.

   Which products is an admin decision — whatever is ticked as
   featured — so this is a shop window that can be redressed without a
   deploy.
   ================================================================== */

export type BannerAction = {
  label: string;
  href: string;
  variant?: "primary" | "outline-light";
};

export function ProductBanner({
  title,
  accent,
  subhead,
  lede,
  products,
  actions,
  image,
  imageAlt,
}: {
  title: string;
  accent?: string;
  subhead?: string;
  lede?: string;
  products: Product[];
  actions?: BannerAction[];
  /** A photograph behind the whole band, darkened so the copy holds. */
  image?: string;
  imageAlt?: string;
}) {
  const buttons: BannerAction[] = actions ?? [
    { label: "Browse the range", href: "#products" },
    { label: "Talk to us", href: "/contact", variant: "outline-light" },
  ];

  return (
    <section className="dark relative isolate overflow-hidden bg-card">
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt ?? ""}
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          {/* Heavier on the left, where the words are. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-background/92 via-background/70 to-background/25"
          />
        </>
      ) : (
        /* No photograph: a pool of light behind the products instead,
           so the band is not a flat rectangle. */
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_78%_50%,rgba(255,255,255,0.05),transparent_70%)]"
        />
      )}

      <div className="shell relative grid items-center gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h1 className="display text-[clamp(2rem,4.4vw,3.25rem)] text-foreground">
            {title}
            {accent ? (
              <>
                {" "}
                <span className="accent">{accent}</span>
              </>
            ) : null}
          </h1>

          {/* The one-line promise, in the size the page heroes use it.
              It is a sentence, not a label, so it is not set in tiny
              letter-spaced capitals. */}
          {subhead ? <p className="subhead mt-4 max-w-lg">{subhead}</p> : null}

          {lede ? (
            <p className="lede mt-5 max-w-lg text-foreground/70">{lede}</p>
          ) : null}

          <div className="mt-9 flex flex-wrap gap-3">
            {buttons.map((button) => (
              <Button key={button.href} href={button.href} variant={button.variant}>
                {button.label}
              </Button>
            ))}
          </div>
        </div>

        <ShopBannerProducts products={products} />
      </div>
    </section>
  );
}
