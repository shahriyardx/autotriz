"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/* ==================================================================
   THE PRODUCT GALLERY

   The main shot, with the rest of the pictures under it. One picture
   and the thumbnails do not appear at all, so a product with a single
   pack shot looks exactly as it did before there was a gallery.
   ================================================================== */

export function ProductGallery({
  images,
  onSale,
}: {
  images: { url: string; alt: string }[];
  onSale: boolean;
}) {
  const [active, setActive] = useState(0);
  const shown = images[active] ?? images[0];
  const many = images.length > 1;

  /* Wraps around rather than stopping. With four pictures there is no
     sense in which one of them is the end. */
  const step = (by: number) =>
    setActive((current) => (current + by + images.length) % images.length);

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden">
        {onSale ? (
          <span className="label absolute left-4 top-4 z-10 rounded-sm bg-primary px-2.5 py-1.5 text-primary-foreground">
            Sale
          </span>
        ) : null}

        {shown ? (
          <Image
            key={shown.url}
            src={shown.url}
            alt={shown.alt}
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

        {many ? (
          <>
            <Step side="left" onClick={() => step(-1)}>
              <ChevronLeft className="size-5" />
            </Step>
            <Step side="right" onClick={() => step(1)}>
              <ChevronRight className="size-5" />
            </Step>

            <p className="label pointer-events-none absolute bottom-4 right-4 rounded-sm bg-foreground/70 px-2 py-1 text-background">
              {active + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden border transition-colors",
                  index === active
                    ? "border-primary"
                    : "border-border hover:border-foreground/40",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  width={240}
                  height={240}
                  sizes="12vw"
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------
   One of the two arrows over the main image. Faint until the picture
   is hovered on a desktop, always there on a touch screen, where
   there is no hover to wait for.
   ------------------------------------------------------------------ */

function Step({
  children,
  side,
  onClick,
}: {
  children: React.ReactNode;
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center",
        "bg-background/80 text-foreground backdrop-blur transition-all",
        "hover:bg-background hover:text-primary",
        "opacity-100 md:opacity-0 md:group-hover:opacity-100",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      {children}
    </button>
  );
}
