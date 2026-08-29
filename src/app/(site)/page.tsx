import Image from "next/image";
import { HeroVideo } from "@/components/hero-video";
import { Markdown } from "@/components/markdown";
import { Reveal } from "@/components/reveal";
import { Newsletter } from "@/components/newsletter";
import { Band, Button, FeatureCard, Heading, Stat } from "@/components/ui";
import { benefitIcons } from "@/components/icons";
import { services } from "@/lib/site";
import { getPage } from "@/lib/page-store";
import Link from "next/link";
import { listCategories } from "@/lib/catalogue";

type Card = { categorySlug: string; image: string; body: string };
type Stat = { value: string; label: string };
type Benefit = { name: string; body: string };
type Cert = { name: string; note: string };

export default async function HomePage() {
  const categories = await listCategories({ topLevelOnly: true });
  const page = getPage("home");

  const heroVideo = page.text("hero.video");
  const heroPoster = page.text("hero.image", "/video/hero-poster.webp");
  const showcase = page.list<Card>("showcase");
  const stats = page.list<Stat>("stats.items");
  const benefits = page.list<Benefit>("benefits.items");
  const certifications = page.list<Cert>("certs.items");

  return (
    <>
      {/* ================================================================
          HERO
          The 3D car scene will take over this block in the next phase;
          the still photograph is the fallback it keeps for mobile and
          for anything without WebGL.
          ================================================================ */}
      <section className="dark relative isolate flex min-h-[clamp(30rem,78vh,44rem)] items-center overflow-hidden bg-black text-foreground">
        {heroVideo ? (
          <HeroVideo src={heroVideo} poster={heroPoster} />
        ) : (
          <Image
            src={heroPoster}
            alt={page.text("hero.imageAlt")}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-70"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent"
        />

        <div className="shell relative py-24">
          <h1 className="display animate-rise text-[clamp(2.25rem,5.5vw,4.25rem)] text-foreground">
            <span className="block">{page.text("hero.line1")}</span>
            <span className="block">{page.text("hero.line2")}</span>
            <span className="accent block">{page.text("hero.accent")}</span>
          </h1>

          <p className="mt-8 max-w-xl animate-rise text-foreground/80 [animation-delay:120ms]">
            {page.text("hero.lede")}
          </p>

          <div className="mt-10 flex flex-wrap gap-4 animate-rise [animation-delay:240ms]">
            <Button href={page.text("hero.primaryHref", "/shop")}>
              {page.text("hero.primaryLabel")}
            </Button>
            <Button href={page.text("hero.secondaryHref", "/about")} variant="outline-light">
              {page.text("hero.secondaryLabel")}
            </Button>
          </div>
        </div>
      </section>

      {/* ================================================================
          INTRODUCTION
          ================================================================ */}
      <Band tone="white">
        <div className="shell">
          <Heading
            accent={page.text("intro.accent")}
            rule
            subhead={page.text("intro.subhead")}
          >
            {page.text("intro.heading")}
          </Heading>
          <Markdown className="prose-center mt-10">{page.text("intro.body")}</Markdown>
        </div>
      </Band>

      {/* ================================================================
          RANGE SHOWCASE
          ================================================================ */}
      <Band tone="mist" className="pt-0">
        <div className="shell">
          <ul className="grid gap-10 md:grid-cols-3">
            {showcase.map((item, i) => {
              const category = categories.find((c) => c.slug === item.categorySlug);
              if (!category) return null;
              return (
                <Reveal as="li" key={item.categorySlug} delay={i} className="group text-center">
                  <a href={category.href} className="block">
                    <div className="relative aspect-4/3 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={category.name}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    </div>
                    <h3 className="display mt-7 text-xl transition-colors group-hover:text-primary">
                      {category.name}
                    </h3>
                    <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-foreground/75">
                      {item.body}
                    </p>
                    <span className="label mt-6 inline-block border-b-2 border-primary pb-1 text-foreground">
                      {category.productCount} products
                    </span>
                  </a>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </Band>

      {/* ================================================================
          NUMBERS
          ================================================================ */}
      <Band tone="dark" className="py-20 md:py-24">
        <div className="shell">
          <Heading tone="light" size="sm">
            {page.text("stats.heading")}
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

      {/* ================================================================
          WHY AUTOTRIZ
          ================================================================ */}
      <Band tone="dark" className="pt-0">
        <div className="shell">
          <Heading tone="light" accent={page.text("benefits.accent")} rule>
            {page.text("benefits.heading")}
          </Heading>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => {
              const Icon = benefitIcons[String(i + 1).padStart(2, "0") as keyof typeof benefitIcons];
              return (
                <Reveal as="li" key={b.name} delay={i % 3}>
                  <FeatureCard icon={Icon ? <Icon /> : null} title={b.name} className="h-full">
                    {b.body}
                  </FeatureCard>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </Band>

      {/* ================================================================
          TECHNOLOGY TESTING
          ================================================================ */}
      <Band tone="white">
        <div className="shell">
          <Heading
            accent={page.text("certs.accent")}
            rule
            subhead={page.text("certs.subhead")}
          >
            {page.text("certs.heading")}
          </Heading>
          <ul className="mt-14 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {certifications.map((c, i) => (
              <Reveal as="li" key={c.name} delay={i} className="bg-background p-10 text-center">
                <p className="display text-2xl">{c.name}</p>
                <p className="mt-3 text-sm text-foreground/75">{c.note}</p>
              </Reveal>
            ))}
          </ul>

          <div className="mt-14 text-center">
            <Button href={page.text("certs.ctaHref", "/shop")}>
              {page.text("certs.ctaLabel")}
            </Button>
          </div>
        </div>
      </Band>

      {/* ================================================================
          APPLICATORS + SERVICES
          ================================================================ */}
      <Band tone="dark" className="py-20 md:py-24">
        <div className="shell grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Heading
              tone="light"
              align="left"
              accent={page.text("services.accent")}
              subhead={page.text("services.subhead")}
            >
              {page.text("services.heading")}
            </Heading>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href={page.text("services.ctaHref", "/contact")}>
                {page.text("services.ctaLabel")}
              </Button>
              <Button href="/services" variant="outline-light">
                Our services
              </Button>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group block h-full border border-foreground/15 bg-card p-6 transition-colors hover:border-primary"
                >
                  <p className="display text-base text-foreground transition-colors group-hover:text-primary">
                    {s.name}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">{s.short}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
