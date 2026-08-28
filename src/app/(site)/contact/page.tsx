import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Band, Heading } from "@/components/ui";

import { getPage } from "@/lib/page-store";
import { getShopSettings } from "@/lib/shop-store";
import { Markdown } from "@/components/markdown";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach AUTOTRIZ Bangladesh in Dhaka — orders, bookings, technical questions and documentation requests.",
};

const topics = ["general", "services", "booking"] as const;
type Topic = (typeof topics)[number];

const messageLabels: Record<Topic, string> = {
  general: "How can we help?",
  services: "Which service, and which car?",
  booking: "Which service, which car, and when would suit you?",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [page, shop] = await Promise.all([getPage("contact"), getShopSettings()]);
  const { topic: raw } = await searchParams;
  const topic: Topic = topics.includes(raw as Topic) ? (raw as Topic) : "general";

  return (
    <>
      <PageHero
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        subhead={page.text("hero.subhead")}
        lede={page.text("hero.lede")}
      />

      <Band tone="white" className="py-16 md:py-20">
        <div className="shell">
          <ul className="grid gap-10 sm:grid-cols-3">
            <Reveal as="li" className="text-center">
              <p className="label text-muted-foreground">Location</p>
              <p className="display-tight mt-4 text-lg">
                {shop.city}, {shop.country}
              </p>
              {shop.address ? (
                <p className="mt-2 text-sm text-foreground/75">{shop.address}</p>
              ) : null}
            </Reveal>
            <Reveal as="li" delay={1} className="text-center">
              <p className="label text-muted-foreground">Phone</p>
              {shop.phone ? (
                <a
                  href={`tel:${shop.tel}`}
                  className="display-tight mt-4 block text-lg transition-colors hover:text-primary"
                >
                  {shop.phone}
                </a>
              ) : (
                <p className="display-tight mt-4 text-lg text-muted-foreground">Coming soon</p>
              )}
            </Reveal>
            <Reveal as="li" delay={2} className="text-center">
              <p className="label text-muted-foreground">Hours</p>
              <p className="display-tight mt-4 text-lg">{shop.hours}</p>
            </Reveal>
          </ul>
        </div>
      </Band>

      <Band tone="mist">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Heading align="left" size="sm">
              {page.text("form.directHeading")}
            </Heading>
            <a
              href={`mailto:${shop.email}`}
              className="display-tight mt-6 block break-all text-lg transition-colors hover:text-primary"
            >
              {shop.email}
            </a>

            <div className="mt-10">
              <p className="label text-muted-foreground">Brand</p>
              <Markdown className="mt-3">{page.text("form.brandNote")}</Markdown>
            </div>

            <div className="mt-10">
              <p className="label text-muted-foreground">Social</p>
              <ul className="mt-3 space-y-2">
                {shop.social.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground/75 transition-colors hover:text-foreground"
                    >
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <Heading align="left" size="sm">
              {page.text("form.heading")}
            </Heading>
            <div className="mt-8">
              <LeadForm
                topic={topic}
                submitLabel="Send message"
                messageLabel={messageLabels[topic]}
              />
            </div>
          </div>
        </div>
      </Band>
    </>
  );
}
