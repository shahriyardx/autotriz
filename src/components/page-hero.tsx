import Image from "next/image";
import { Heading } from "@/components/ui";
import { cn } from "@/lib/cn";

/** The banner every interior page opens with: a charcoal strip with a
 *  centred uppercase title, optionally over a photograph. */
export function PageHero({
  title,
  accent,
  subhead,
  lede,
  image,
  imageAlt,
  className,
}: {
  title: string;
  accent?: string;
  subhead?: string;
  lede?: string;
  image?: string;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "dark relative isolate flex min-h-[18rem] items-center overflow-hidden bg-card py-20 md:min-h-[24rem]",
        className,
      )}
    >
      {image ? (
        <>
          <Image
            src={image}
            alt={imageAlt ?? ""}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45"
          />
          <div aria-hidden className="absolute inset-0 bg-black/40" />
        </>
      ) : null}

      <div className="shell relative">
        <Heading as="h1" tone="light" size="xl" accent={accent} subhead={subhead}>
          {title}
        </Heading>
        {lede ? (
          <p className="prose-center mt-8 max-w-3xl text-foreground/70">{lede}</p>
        ) : null}
      </div>
    </section>
  );
}
