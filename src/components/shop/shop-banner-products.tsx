"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/shop-config";
import type { Product } from "@/lib/catalogue";

/* ==================================================================
   THE PRODUCTS IN THE SHOP BANNER

   Three across on a desktop, two on a phone. Feature a fourth and it
   becomes a slider rather than shrinking what is already there — the
   tiles stay the same size and the extra ones wait off to the side.

   The sliding itself is the browser's: a scroll-snapping row, so a
   touch swipe works with no JavaScript at all. The arrows only exist
   for a mouse, and move by exactly one screenful.
   ================================================================== */

export function ShopBannerProducts({ products }: { products: Product[] }) {
  const rail = useRef<HTMLUListElement>(null);
  const sliding = products.length > 3;

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const readPosition = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    // A rounding allowance, or the last page never counts as the end.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    if (!sliding) return;
    readPosition();
    window.addEventListener("resize", readPosition);
    return () => window.removeEventListener("resize", readPosition);
  }, [sliding, readPosition]);

  const page = (direction: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <div className="relative">
      <ul
        ref={rail}
        onScroll={sliding ? readPosition : undefined}
        className={cn(
          "grid grid-flow-col gap-3 sm:gap-4",
          /* Exactly two tiles on a phone and three above it, gaps
             subtracted so the third never hangs over the edge. */
          "auto-cols-[calc((100%-0.75rem)/2)] sm:auto-cols-[calc((100%-2rem)/3)]",
          sliding &&
            "snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {products.map((product) => (
          <li key={product.id} className={cn(sliding && "snap-start")}>
            <BannerProduct product={product} />
          </li>
        ))}
      </ul>

      {sliding ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="label text-foreground/40">
            {products.length} featured · swipe or use the arrows
          </p>

          <div className="flex gap-2">
            <Arrow label="Previous products" disabled={atStart} onClick={() => page(-1)}>
              <ChevronLeft className="size-4" />
            </Arrow>
            <Arrow label="More products" disabled={atEnd} onClick={() => page(1)}>
              <ChevronRight className="size-4" />
            </Arrow>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Arrow({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 shrink-0 place-items-center border border-foreground/20 text-foreground/75 transition-colors",
        "hover:border-primary hover:text-primary",
        disabled && "cursor-not-allowed opacity-25 hover:border-foreground/20 hover:text-foreground/75",
      )}
    >
      {children}
    </button>
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
            sizes="(min-width: 1024px) 15vw, 45vw"
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
