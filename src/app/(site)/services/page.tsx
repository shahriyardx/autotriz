import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Band, Button, Heading, Stat } from "@/components/ui";
import { serviceStats, services } from "@/lib/site";
import { getPage } from "@/lib/page-store";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Paint protection film, ceramic window tint, machine polishing and maintenance washing — applied by AUTOTRIZ-trained installers in Bangladesh.",
};

type Reason = { t: string; d: string };

export default async function ServicesPage() {
  const page = getPage("services");
  const reasons = page.list<Reason>("reasons.items");

  return (
    <>
      <PageHero
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        subhead={page.text("hero.subhead")}
        lede={page.text("hero.lede")}
        image={page.text("hero.image", "/photo/coating-application.webp")}
        imageAlt="A technician applying protection to a car"
      />

      <Band tone="dark" className="py-16 md:py-20">
        <div className="shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {serviceStats.map((s, i) => (
            <Reveal key={s.label} delay={i}>
              <Stat value={s.value} label={s.label} />
            </Reveal>
          ))}
        </div>
      </Band>

      <Band tone="white">
        <div className="shell">
          <Heading accent="offer" rule subhead="Four services, one standard">
            What we
          </Heading>
          <ul className="mt-14 grid gap-8 md:grid-cols-2">
            {services.map((s, i) => (
              <Reveal
                as="li"
                key={s.slug}
                delay={i % 2}
                className="group flex flex-col overflow-hidden border border-border transition-colors hover:border-primary"
              >
                <Link href={`/services/${s.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-muted">
                  <Image
                    src={s.image}
                    alt={s.name}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col p-8">
                  <h2 className="display text-xl">
                    <Link href={`/services/${s.slug}`} className="transition-colors hover:text-primary">
                      {s.name}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/75">{s.short}</p>
                  <ul className="mt-5 space-y-2">
                    {s.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-3 text-sm text-foreground/75">
                        <span aria-hidden className="h-1 w-3 shrink-0 bg-primary" />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button href={`/services/${s.slug}`}>Learn more</Button>
                    <Button href="/contact?topic=services" variant="outline">
                      Book a call
                    </Button>
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Band>

      <Band tone="mist">
        <div className="shell">
          <Heading accent={page.text("reasons.accent")} rule>
            {page.text("reasons.heading")}
          </Heading>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <Reveal as="li" key={r.t} delay={i} className="bg-background p-8 text-center">
                <h3 className="display text-base">{r.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">{r.d}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
