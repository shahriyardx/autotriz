import type { Metadata } from "next";
import Image from "next/image";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Band, Button, Heading, Stat } from "@/components/ui";
import { certifications, stats } from "@/lib/site";
import { getPage } from "@/lib/page-store";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = {
  title: "About",
  description:
    "AUTOTRIZ is a manufacturer of polysilazane nano ceramic coatings, operated by Triz International Sdn. Bhd. with six collaborating R&D centres worldwide.",
};

const rd = ["Germany", "Japan", "South Korea", "Taiwan", "France", "United States"];

const pillars = [
  { t: "Cutting-edge technology", d: "Up-to-date technology, facilities and technical know-how built on international standards." },
  { t: "Durable, high-quality materials", d: "Global reach in sourcing the rarest and finest raw materials from around the world." },
  { t: "Bespoke service", d: "Thorough assistance and clear answers for every kind of support request." },
  { t: "24/7 customer service", d: "Online support by call, email and live chat across time zones and regions." },
];

const company = [
  {
    t: "World leader in nano technology",
    d: "AUTOTRIZ is a leading name in nano ceramic surface protection, with a series of ceramic coating and paint protection film products, each formulated for a specific surface. Our formulas are designed for paint, vinyl, fabric, glass, leather and more. AUTOTRIZ coatings bond at a nano-molecular level, filling every pore and creating a permanent, protective surface. Our VERTEK films were developed with the same patented polysilazane technology.",
  },
  {
    t: "Safety and regulations",
    d: "We are committed to supplying products and services of the highest quality and to meeting our customers' requirements. The cornerstone is an effective quality management system that meets ISO 9001:2015, complies with applicable statutory and regulatory requirements, and involves every level of the organisation.",
  },
  {
    t: "State-of-the-art production",
    d: "We manufacture our own products and are organised to meet growing demand. With extensive raw materials, technical know-how and advanced technology from around the globe, our formulas are developed and tested in-house — which is also why we can supply OEM customers and customise formulations for other brands.",
  },
  {
    t: "Network and business",
    d: "We offer top-quality products, outstanding service and technical support to build long-term relationships with the workshops, detailers and car owners we serve, backed by a dedicated customer service desk and our social channels.",
  },
];

export default async function AboutPage() {
  const page = await getPage("about");

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

      <Band tone="white">
        <div className="shell">
          <Heading
            accent={page.text("chemistry.accent")}
            rule
            subhead={page.text("chemistry.subhead")}
          >
            {page.text("chemistry.heading")}
          </Heading>
          <Markdown className="prose-center mt-10">{page.text("chemistry.body")}</Markdown>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              {
                k: "OPSZ",
                t: "Organic polysilazane",
                d: "Cures into a hydrophobic layer. This is what makes water bead, lift dirt and leave the panel as it rolls off.",
              },
              {
                k: "PHPS",
                t: "Perhydropolysilazane",
                d: "Cures into a hydrophilic, glass-like film. Used where sheeting matters more than beading.",
              },
              {
                k: "3D Matrix",
                t: "Cross-linked nano structure",
                d: "The resin fills nanopores in the clear coat and cross-links in three dimensions. Removable only by machine polishing.",
              },
            ].map((row, i) => (
              <Reveal key={row.k} delay={i} className="text-center">
                <p className="label text-primary">{row.k}</p>
                <h3 className="display mt-4 text-lg">{row.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">{row.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      <Band tone="mist">
        <div className="shell">
          <Heading accent="innovation" rule subhead="Six R&D centres, one standard">
            People behind the
          </Heading>
          <p className="prose-center mt-10 text-foreground/75">
            We collaborate with R&D centres in Germany, Japan, South Korea,
            Taiwan, France and the United States, and with leading
            universities. Our chemical engineers and materials scientists do not
            just improve a surface&apos;s properties — they optimise them for the long
            term.
          </p>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <Reveal as="li" key={p.t} delay={i} className="bg-background p-8 text-center">
                <h3 className="display text-base">{p.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">{p.d}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Band>

      <Band tone="dark" className="py-20 md:py-24">
        <div className="shell">
          <Heading tone="light" size="sm">
            We take pride in our numbers
          </Heading>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i}>
                <Stat value={s.value} label={s.label} />
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      <Band tone="white">
        <div className="shell grid gap-14 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <Image
              src={page.text("manufacturing.image", "/photo/hero-wash.webp")}
              alt="A vehicle being prepared in a detailing bay"
              width={2000}
              height={1125}
              className="w-full object-cover"
            />
          </Reveal>
          <div>
            <Heading align="left" accent={page.text("manufacturing.accent")} size="lg">
              {page.text("manufacturing.heading")}
            </Heading>
            <Markdown className="mt-7">{page.text("manufacturing.body")}</Markdown>
            <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3">
              {rd.map((country) => (
                <li key={country} className="flex items-center gap-3 text-sm text-foreground/75">
                  <span aria-hidden className="h-1 w-3 shrink-0 bg-primary" />
                  {country}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <Band tone="dark">
        <div className="shell">
          <Heading tone="light" accent="company" rule>
            The
          </Heading>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {company.map((c, i) => (
              <Reveal key={c.t} delay={i % 2} className="border border-foreground/15 bg-card p-8">
                <h3 className="display text-lg text-foreground">{c.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">{c.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Band>

      <Band tone="mist">
        <div className="shell">
          <Heading accent="Testing" rule subhead="Verified by people who are not us">
            Technology
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
            <p className="text-foreground/75">
              AUTOTRIZ® is operated by Triz International Sdn. Bhd.
            </p>
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
