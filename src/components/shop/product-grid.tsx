import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/reveal";
import type { Product } from "@/lib/catalogue";

export function ProductGrid({
  items,
  columns = 4,
}: {
  items: Product[];
  columns?: 3 | 4;
}) {
  if (!items.length) {
    return (
      <div className="border border-dashed border-border py-24 text-center">
        <p className="display text-xl">Nothing matches those filters</p>
        <p className="mt-3 text-sm text-foreground/75">
          Try widening the price range or clearing a filter.
        </p>
      </div>
    );
  }

  return (
    <ul
      className={
        columns === 3
          ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {items.map((product, i) => (
        <Reveal as="li" key={product.id} delay={i % 4} className="h-full">
          <ProductCard product={product} className="h-full" />
        </Reveal>
      ))}
    </ul>
  );
}
