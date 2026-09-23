import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award } from "lucide-react";
import { Faq } from "@/components/faq";
import { Newsletter } from "@/components/newsletter";
import { ProductBanner } from "@/components/shop/product-banner";
import { Reveal } from "@/components/reveal";
import { Split } from "@/components/split";
import { Team } from "@/components/team";
import { Band, Button, Heading, Stat } from "@/components/ui";
import { listProducts } from "@/lib/catalogue";
import { serviceFaq, servicesFaq } from "@/lib/faq";
import { serviceStats, services } from "@/lib/site";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return { title: service.name, description: service.short };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const others = services.filter((s) => s.slug !== slug);
  const [first, ...rest] = service.name.split(" ");

  /* The chemistry the service is carried out with, in front of whoever
     is reading about the service. */
  const featured = await listProducts({ featuredOnly: true });

  // A service with nothing of its own falls back to the general set.
  const faq = serviceFaq[slug] ?? servicesFaq;

  return (
    <>
      <ProductBanner
        title={first}
        accent={rest.join(" ") || undefined}
        subhead={service.short}
        lede={service.lede}
        image={service.image}
        imageAlt={service.name}
        products={featured}
        actions={[
          { label: "Enquire about this service", href: "/contact?topic=services" },
          { label: "Shop the range", href: "/shop", variant: "outline-light" },
        ]}
      />

      {/* ================================================================
          ABOUT THE SERVICE
          Photograph on the left, the writing on the right.
          ================================================================ */}
      <Band tone="white">
        <div className="shell">
          <Split eyebrow="About the service" image={service.image} imageAlt={service.name}>
            <h2 className="display mt-5 text-[clamp(1.75rem,3.4vw,2.75rem)]">
              Perfection in every{" "}
              <span className="accent">detail</span>
            </h2>
            {service.body.map((para) => (
              <p key={para} className="mt-6 leading-relaxed text-foreground/75">
                {para}
              </p>
            ))}
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/contact?topic=services">Enquire about this service</Button>
              <Button href="/services" variant="outline">
                All services
              </Button>
            </div>
          </Split>
        </div>
      </Band>

      {/* ================================================================
          WHAT YOU GET
          The same block the other way round, with the highlights as a
          grid rather than a list down the side.
          ================================================================ */}
      <Band tone="mist">
        <div className="shell">
          <Split
            eyebrow="Why AUTOTRIZ"
            image="/about/production-line.webp"
            imageAlt="AUTOTRIZ coating bottles on the production line"
            reverse
          >
            <h2 className="display mt-5 text-[clamp(1.75rem,3.4vw,2.75rem)]">
              What you <span className="accent">get</span>
            </h2>
            <p className="mt-6 leading-relaxed text-foreground/75">{service.short}</p>

            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {service.highlights.map((h) => (
                <li key={h} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/40 bg-background">
                    <Award className="h-5 w-5 text-primary" aria-hidden />
                  </span>
                  <p className="pt-2 text-sm leading-relaxed font-medium text-foreground">{h}</p>
                </li>
              ))}
            </ul>
          </Split>
        </div>
      </Band>

      <Band tone="dark">
        <div className="shell">
          <Heading tone="light" accent="works" rule>
            How it
          </Heading>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {service.steps.map((s, i) => (
              <Reveal
                as="li"
                key={s.t}
                delay={i}
                className="border border-foreground/15 bg-card p-8 text-center"
              >
                <span className="display text-3xl text-primary">0{i + 1}</span>
                <h3 className="display mt-5 text-base text-foreground">{s.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">{s.d}</p>
              </Reveal>
            ))}
          </ol>
          <div className="mt-16 grid gap-10 border-t border-foreground/10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
            {serviceStats.map((s, i) => (
              <Reveal key={s.label} delay={i}>
                <Stat value={s.value} label={s.label} />
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      <Band tone="mist" className="py-16 md:py-20">
        <div className="shell">
          <Heading size="sm" rule>
            Other services
          </Heading>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {others.map((s, i) => (
              <Reveal as="li" key={s.slug} delay={i} className="bg-background p-8">
                <h3 className="display text-base">
                  <Link href={`/services/${s.slug}`} className="transition-colors hover:text-primary">
                    {s.name}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/75">{s.short}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Band>

      <Team />

      <Band tone="white">
        <Faq items={faq} subhead={`About ${service.name.toLowerCase()}`} />
      </Band>

      <Newsletter />
    </>
  );
}
