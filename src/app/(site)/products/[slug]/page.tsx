import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { Newsletter } from "@/components/newsletter";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductTabs } from "@/components/shop/product-tabs";
import { Band, Heading } from "@/components/ui";
import { getProduct, inStock, listProducts } from "@/lib/catalogue";
import { formatPrice, currency, FREE_SHIPPING_THRESHOLD } from "@/lib/shop-config";
import { site } from "@/lib/site";
import { markdownToText, truncate } from "@/lib/markdown-text";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: truncate(markdownToText(product.description), 180),
    openGraph: { images: product.image ? [product.image] : [] },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = (
    await listProducts({ categorySlugs: [product.category.slug], limit: 5 })
  )
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const available = inStock(product);
  const onSale =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: markdownToText(product.description),
    brand: { "@type": "Brand", name: site.name },
    image: product.image ? [`${site.url}${product.image}`] : undefined,
    offers: {
      "@type": "Offer",
      price: (product.price / 100).toFixed(2),
      priceCurrency: currency.code,
      availability: available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${site.url}/products/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Band tone="white" className="py-10 md:py-14">
        <div className="shell">
          <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-2.5 text-muted-foreground">
            <Link href="/shop" className="transition-colors hover:text-foreground">
              Shop
            </Link>
            <span aria-hidden>/</span>
            <Link href={product.category.href} className="transition-colors hover:text-foreground">
              {product.category.name}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* --- gallery --- */}
            <div className="lg:col-span-7">
              <div className="group relative aspect-square overflow-hidden">
                {onSale ? (
                  <span className="label absolute left-4 top-4 z-10 rounded-sm bg-primary px-2.5 py-1.5 text-primary-foreground">
                    Sale
                  </span>
                ) : null}
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={1200}
                    height={1200}
                    priority
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                  />
                ) : (
                  <span className="label absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Pack shot to follow
                  </span>
                )}
              </div>
            </div>

            {/* --- buy box --- */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-32">
                <p className="label text-muted-foreground">{product.category.name}</p>
                <h1 className="display mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)]">
                  {product.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-baseline gap-3">
                  <span className="display text-2xl text-primary">
                    {formatPrice(product.price)}
                  </span>
                  {onSale ? (
                    <span className="text-muted-foreground line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                  ) : null}
                  {product.size ? (
                    <span className="label text-muted-foreground">{product.size}</span>
                  ) : null}
                </div>

                <p className="mt-6 leading-relaxed text-foreground/75">
                  {product.shortDescription.trim()
                    ? product.shortDescription
                    : truncate(markdownToText(product.description), 240)}
                </p>

                {/* stock line */}
                <p className="label mt-7 flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={
                      available
                        ? "h-2 w-2 rounded-full bg-green-600"
                        : "h-2 w-2 rounded-full bg-red-500"
                    }
                  />
                  {available ? (
                    product.trackStock && product.stock <= 5 ? (
                      <span className="text-primary">
                        Low stock — {product.stock} left
                      </span>
                    ) : (
                      <span className="text-foreground/75">In stock</span>
                    )
                  ) : (
                    <span className="text-foreground/75">Out of stock</span>
                  )}
                </p>

                <div className="mt-7">
                  <AddToCart
                    product={{
                      slug: product.slug,
                      name: product.name,
                      sku: product.sku,
                      price: product.price,
                      image: product.image,
                      size: product.size,
                    }}
                    disabled={!available}
                  />
                </div>

                <ul className="mt-8 space-y-2.5 border-t border-border pt-7">
                  {[
                    `Free shipping over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
                    "Tested and certified by TÜV SÜD and SGS",
                    "Data sheets available on request",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3 text-sm text-foreground/75">
                      <span aria-hidden className="mt-2 h-1 w-3 shrink-0 bg-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <ProductTabs product={product} />
          </div>
        </div>
      </Band>

      {related.length ? (
        <Band tone="mist">
          <div className="shell">
            <Heading size="sm" rule>
              You may also need
            </Heading>
            <div className="mt-12">
              <ProductGrid items={related} />
            </div>
          </div>
        </Band>
      ) : null}

      <Newsletter />
    </>
  );
}
