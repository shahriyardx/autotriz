import type { Metadata } from "next";
import Image from "next/image";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Markdown } from "@/components/markdown";
import { Band, Button, Heading } from "@/components/ui";
import { certifications } from "@/lib/site";
import { getPage } from "@/lib/page-store";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "About",
  description:
    "AUTOTRIZ is a producer of high-purity nano ceramic coatings and specialty chemicals, working with six R&D centres and manufacturing its own products.",
};

type Centre = { name: string };
type Resin = { code: string; name: string; body: string };
type Pillar = { icon: string; title: string; body: string };
type Section = { title: string; accent?: string; body: string; image?: string };

export default async function AboutPage() {
  const page = getPage("about");

  const centres = page.list<Centre>("people.centres");
  const resins = page.list<Resin>("polysilazane.resins");
  const pillars = page.list<Pillar>("pillars.items");
  const company = page.list<Section>("company.items");

  return (
    <>
      <PageHero
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        lede={page.text("hero.lede")}
        image={page.text("hero.image", "/about/hero-beads.webp")}
        imageAlt="Water beading on a coated surface"
        className="min-h-[22rem] md:min-h-[30rem]"
      />

      {/* ================================================================
          PEOPLE
          A plain two-column band: the laboratory on one side, who runs
          it on the other, with the six R&D centres set out as a grid.
          ================================================================ */}
      <section className="dark bg-card py-20 md:py-28">
        <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={page.text("people.image", "/about/people-lab.webp")}
                alt="Chemists at work in the laboratory"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={1}>
            <Heading align="left" accent={page.text("people.accent")} size="lg">
              {page.text("people.heading")}
            </Heading>
            <Markdown className="mt-7">{page.text("people.body")}</Markdown>

            {centres.length ? (
              <div className="mt-10">
                <p className="label text-muted-foreground">R&amp;D centres</p>
                <ul className="mt-5 grid grid-cols-2 gap-px border border-foreground/10 bg-foreground/10 sm:grid-cols-3">
                  {centres.map((centre) => (
                    <li
                      key={centre.name}
                      className="bg-card px-4 py-3.5 text-sm text-foreground/80"
                    >
                      {centre.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* ================================================================
          POLYSILAZANE
          Copy on the left, the photograph bleeding off the right edge.
          ================================================================ */}
      <section className="dark relative isolate overflow-hidden bg-background py-20 md:py-28">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block">
          <Image
            src={page.text("polysilazane.image", "/about/polysilazane.webp")}
            alt="A coating being applied by hand"
            fill
            sizes="50vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent"
          />
        </div>

        <div className="shell relative">
          <div className="lg:max-w-xl">
            <Heading align="left" accent={page.text("polysilazane.accent")} size="lg">
              {page.text("polysilazane.heading")}
            </Heading>
            <p className="subhead mt-4">{page.text("polysilazane.subhead")}</p>
            <Markdown className="mt-7">{page.text("polysilazane.body")}</Markdown>

            <ul className="mt-8 space-y-4">
              {resins.map((resin) => (
                <li key={resin.code} className="border-l-2 border-primary pl-5">
                  <p className="display-tight text-base text-foreground">
                    {resin.name}{" "}
                    <span className="text-primary">({resin.code})</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground/60">{resin.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ================================================================
          PILLARS
          ================================================================ */}
      <section className="dark bg-card py-16 md:py-24">
        <div className="shell">
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => (
              <Reveal as="li" key={pillar.title} delay={i} className="text-center">
                {pillar.icon ? (
                  <span className="mx-auto grid size-16 place-items-center rounded-md border border-primary/60">
                    <Image
                      src={pillar.icon}
                      alt=""
                      width={563}
                      height={550}
                      className="h-8 w-8 object-contain"
                    />
                  </span>
                ) : null}
                <h3 className="display mt-6 text-base text-foreground">{pillar.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">
                  {pillar.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ================================================================
          THE COMPANY
          Alternating halves, held inside the page's own measure rather
          than running to the window edges.
          ================================================================ */}
      <Band tone="white">
        <div className="shell space-y-16 md:space-y-24">
          {company.map((section, i) => (
            <SplitSection key={section.title} section={section} flip={i % 2 === 1} />
          ))}
        </div>
      </Band>

      {/* ================================================================
          CERTIFICATION
          ================================================================ */}
      <Band tone="mist">
        <div className="shell">
          <Heading
            accent={page.text("certs.accent")}
            rule
            subhead={page.text("certs.subhead")}
          >
            {page.text("certs.heading")}
          </Heading>

          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((c, i) => (
              <Reveal as="li" key={c.name} delay={i} className="bg-background p-10 text-center">
                <p className="display text-2xl">{c.name}</p>
                <p className="mt-3 text-sm text-foreground/75">{c.note}</p>
              </Reveal>
            ))}
          </ul>

          <div className="mt-14 text-center">
            <p className="text-foreground/75">{page.text("certs.note")}</p>
            <div className="mt-8">
              <Button href="/contact">Talk to us</Button>
            </div>
          </div>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}

/* ------------------------------------------------------------------
   One half copy, one half photograph. `flip` puts the picture on the
   left instead, so a run of them alternates down the page.
   ------------------------------------------------------------------ */

function SplitSection({ section, flip }: { section: Section; flip: boolean }) {
  return (
    <Reveal>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden bg-muted",
            flip ? "lg:order-1" : "lg:order-2",
          )}
        >
          {section.image ? (
            <Image
              src={section.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className={flip ? "lg:order-2" : "lg:order-1"}>
          <h2 className="display text-[clamp(1.5rem,2.6vw,2rem)]">
            {section.title}
            {section.accent ? (
              <>
                <br />
                <span className="accent">{section.accent}</span>
              </>
            ) : null}
          </h2>
          <span aria-hidden className="mt-6 block h-0.5 w-14 bg-primary" />
          <Markdown className="mt-6">{section.body}</Markdown>
        </div>
      </div>
    </Reveal>
  );
}
