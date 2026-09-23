import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

/* ==================================================================
   PICTURE ON ONE SIDE, WORDS ON THE OTHER

   The block the service pages are built from: a photograph, a small
   gold eyebrow, a heading and whatever the caller puts underneath.
   `reverse` puts the picture on the right instead, so two of these
   stacked read as an alternating page rather than a list.
   ================================================================== */

export function Split({
  eyebrow,
  image,
  imageAlt = "",
  reverse = false,
  priority = false,
  children,
  className,
}: {
  eyebrow?: string;
  image: string;
  imageAlt?: string;
  reverse?: boolean;
  priority?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Reveal>
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          className,
        )}
      >
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden bg-muted",
            reverse ? "lg:order-2" : "lg:order-1",
          )}
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className={reverse ? "lg:order-1" : "lg:order-2"}>
          {eyebrow ? (
            <p className="label flex items-center gap-3 text-primary">
              <span aria-hidden className="h-px w-6 bg-primary" />
              {eyebrow}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </Reveal>
  );
}
