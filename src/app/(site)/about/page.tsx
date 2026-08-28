import type { Metadata } from "next";
import Image from "next/image";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Markdown } from "@/components/markdown";
import { Band, Button, Heading } from "@/components/ui";
import { certifications } from "@/lib/site";
import { getPage } from "@/lib/page-store";

export const metadata: Metadata = {
  title: "About",
  description:
    "AUTOTRIZ is a producer of high-purity nano ceramic coatings and specialty chemicals, working with six R&D centres and manufacturing its own products.",
};

type Centre = { name: string };
type Resin = { code: string; name: string; body: string };
type Pillar = { icon: string; title: string; body: string };
type Section = { title: string; body: string };

export default async function AboutPage() {
  const page = await getPage("about");

  const centres = page.list<Centre>("people.centres");
  const resins = page.list<Resin>("polysilazane.resins");
  const pillars = page.list<Pillar>("pillars.items");
  const company = page.list<Section>("company.items");

  return (
    <>
      <PageHero
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        subhead={page.text("hero.subhead")}
        lede={page.text("hero.lede")}
        image={page.text("hero.image", "/photo/coating-application.webp")}
        imageAlt="Ceramic coating being applied to paintwork"
      />

      {/* ================================================================
          PEOPLE
          ================================================================ */}
      <Band tone="white">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Heading align="left" accent={page.text("people.accent")} size="lg">
              {page.text("people.heading")}
            </Heading>
            <Markdown className="mt-7">{page.text("people.body")}</Markdown>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <div className="border-t-2 border-primary bg-muted p-8">
              <p className="label text-muted-foreground">R&amp;D centres</p>
              <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                {centres.map((centre) => (
                  <li
                    key={centre.name}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <span aria-hidden className="h-1 w-3 shrink-0 bg-primary" />
                    {centre.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Band>

      {/* ================================================================
          THE CHEMISTRY
          ================================================================ */}
      <Band tone="mist">
        <div className="shell">
          <Heading
            accent={page.text("polysilazane.accent")}
            rule
            subhead={page.text("polysilazane.subhead")}
          >
            {page.text("polysilazane.heading")}
          </Heading>

          <Markdown className="prose-center mt-10">
            {page.text("polysilazane.body")}
          </Markdown>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {resins.map((resin, i) => (
              <Reveal key={resin.code} delay={i} className="bg-background p-8">
                <p className="label text-primary">{resin.code}</p>
                <h3 className="display mt-4 text-lg">{resin.name}</h3>
                <p className="mt-4 leading-relaxed text-foreground/75">{resin.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      {/* ================================================================
          PILLARS
          ================================================================ */}
      <Band tone="dark">
        <div className="shell">
          <Heading tone="light" accent={page.text("pillars.accent")} rule>
            {page.text("pillars.heading")}
          </Heading>

          <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar, i) => (
              <Reveal as="li" key={pillar.title} delay={i} className="text-center">
                {pillar.icon ? (
                  <Image
                    src={pillar.icon}
                    alt=""
                    width={563}
                    height={550}
                    className="mx-auto h-16 w-16 object-contain"
                  />
                ) : null}
                <h3 className="display mt-6 text-base text-foreground">{pillar.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">
                  {pillar.body}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Band>

      {/* ================================================================
          THE COMPANY
          ================================================================ */}
      <Band tone="white">
        <div className="shell">
          <Heading accent={page.text("company.accent")} rule>
            {page.text("company.heading")}
          </Heading>

          <div className="mt-16 space-y-14">
            {company.map((section, i) => (
              <Reveal key={section.title} delay={i % 2}>
                <div className="grid gap-6 border-t border-border pt-8 md:grid-cols-12">
                  <h3 className="display text-lg md:col-span-4">{section.title}</h3>
                  <div className="md:col-span-8">
                    <Markdown>{section.body}</Markdown>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
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
