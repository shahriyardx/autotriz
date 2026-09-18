import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
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
  const page = getPage("contact");
  const shop = await getShopSettings();
  const { topic: raw } = await searchParams;
  const topic: Topic = topics.includes(raw as Topic) ? (raw as Topic) : "general";

  return (
    <>
      <PageHero
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        subhead={page.text("hero.subhead")}
        lede={page.text("hero.lede")}
        image={page.text("hero.image", "/photo/coating-application.webp")}
        imageAlt="A coating being applied in the studio"
      />

      <Band tone="white" className="py-14 md:py-16">
        <div className="shell">
          <ul className="grid gap-px border border-border bg-border sm:grid-cols-3">
            <Fact icon={<MapPin className="size-5" />} label="Location" delay={0}>
              <p className="display-tight text-lg">
                {shop.city}, {shop.country}
              </p>
              {shop.address ? (
                <p className="mt-2 text-sm text-foreground/70">{shop.address}</p>
              ) : null}
            </Fact>

            <Fact icon={<Phone className="size-5" />} label="Phone" delay={1}>
              {shop.phone ? (
                <a
                  href={`tel:${shop.tel}`}
                  className="display-tight text-lg transition-colors hover:text-primary"
                >
                  {shop.phone}
                </a>
              ) : (
                <p className="display-tight text-lg text-muted-foreground">Coming soon</p>
              )}
              <p className="mt-2 text-sm text-foreground/70">Call or message us</p>
            </Fact>

            <Fact icon={<Clock className="size-5" />} label="Hours" delay={2}>
              <p className="display-tight text-lg">{shop.hours}</p>
              <p className="mt-2 text-sm text-foreground/70">Friday closed</p>
            </Fact>
          </ul>
        </div>
      </Band>

      <Band tone="mist">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Heading align="left" size="sm">
              {page.text("form.directHeading")}
            </Heading>

            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-4">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center border border-border bg-background text-primary">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="label text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${shop.email}`}
                    className="display-tight mt-1.5 block break-all transition-colors hover:text-primary"
                  >
                    {shop.email}
                  </a>
                </div>
              </li>

              {shop.phone ? (
                <li className="flex items-start gap-4">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center border border-border bg-background text-primary">
                    <Phone className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="label text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${shop.tel}`}
                      className="display-tight mt-1.5 block transition-colors hover:text-primary"
                    >
                      {shop.phone}
                    </a>
                  </div>
                </li>
              ) : null}
            </ul>

            {shop.social.length ? (
              <div className="mt-10">
                <p className="label text-muted-foreground">Social</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {shop.social.map((s) => (
                    <li key={s.name}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="label inline-block border border-border bg-background px-4 py-2.5 text-foreground/75 transition-colors hover:border-primary hover:text-primary"
                      >
                        {s.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-10 border-t border-border pt-7">
              <p className="label text-muted-foreground">Brand</p>
              <Markdown className="mt-3 text-sm">{page.text("form.brandNote")}</Markdown>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <div className="border-t-2 border-primary bg-background p-7 md:p-10">
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
        </div>
      </Band>
    </>
  );
}

/* ------------------------------------------------------------------
   One of the three facts under the hero. A bordered cell with its own
   icon, rather than centred text floating in white space.
   ------------------------------------------------------------------ */

function Fact({
  icon,
  label,
  delay,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal as="li" delay={delay} className="bg-background p-8">
      <span className="grid size-10 place-items-center border border-border text-primary">
        {icon}
      </span>
      <p className="label mt-5 text-muted-foreground">{label}</p>
      <div className="mt-2.5">{children}</div>
    </Reveal>
  );
}
