"use client";

import Image from "next/image";
import { useState } from "react";
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
