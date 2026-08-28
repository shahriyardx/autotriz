import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Band, Button, Heading, Stat } from "@/components/ui";
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

  return (
    <>
      <PageHero
        title={first}
        accent={rest.join(" ") || undefined}
        subhead={service.short}
        lede={service.lede}
        image={service.image}
        imageAlt={service.name}
      />

      <Band tone="white">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Heading align="left" size="sm">
              About the service
            </Heading>
            {service.body.map((para) => (
              <p key={para} className="mt-6 leading-relaxed text-foreground/75">
                {para}
              </p>
            ))}
            <div className="mt-10 flex flex-wrap gap-3">
              <Button href="/contact?topic=services">Book a call</Button>
              <Button href="/services" variant="outline">
                All services
              </Button>
            </div>
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="border-t-2 border-primary bg-muted p-8">
              <p className="label text-muted-foreground">What you get</p>
              <ul className="mt-6 space-y-4">
                {service.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-foreground">
                    <span aria-hidden className="mt-2.5 h-1 w-3 shrink-0 bg-primary" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
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

      <Newsletter />
    </>
  );
}
