import Image from "next/image";
import Link from "next/link";
import { QuickAdd } from "@/components/add-to-cart";
import { formatPrice } from "@/lib/shop-config";
import type { Product } from "@/lib/catalogue";
import { inStock } from "@/lib/shop-search";
import { cn } from "@/lib/cn";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const available = inStock(product);
  const onSale =
    product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border border-border bg-background transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden"
      >
        <span className="absolute left-0 top-0 z-10 flex flex-col items-start gap-1 p-3">
          {onSale ? (
            <span className="label rounded-sm bg-primary px-2 py-1 text-primary-foreground">Sale</span>
          ) : null}
          {!available ? (
            <span className="label rounded-sm bg-foreground px-2 py-1 text-background">
              Sold out
            </span>
          ) : null}
        </span>

        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={900}
            height={900}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        ) : (
          <span className="label absolute inset-0 flex items-center justify-center text-muted-foreground">
            No image
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 text-center">
        <p className="label text-muted-foreground">{product.category.name}</p>

        <h3 className="display mt-3 text-base leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-primary"
          >
            <span className="absolute inset-0 z-0" aria-hidden />
            {product.name}
          </Link>
        </h3>

        <p className="mt-2 text-xs text-muted-foreground">
          {product.sku}
          {product.size ? ` · ${product.size}` : ""}
        </p>

        <p className="mt-4 flex items-baseline justify-center gap-2">
          <span className="display text-lg text-foreground">{formatPrice(product.price)}</span>
          {onSale ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          ) : null}
        </p>

        {available && product.trackStock && product.stock <= 5 ? (
          <p className="label mt-3 text-primary">Only {product.stock} left</p>
        ) : null}

        {/* Sits above the card-wide link overlay so the click lands here. */}
        <div className="relative z-10 mt-5 pt-1">
          <QuickAdd
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
      </div>
    </article>
  );
}
