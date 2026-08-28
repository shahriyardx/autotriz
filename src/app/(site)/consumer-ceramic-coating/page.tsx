import type { Metadata } from "next";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/shop/product-grid";
import { Reveal } from "@/components/reveal";
import { Band, Heading } from "@/components/ui";
import { listProducts } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Ceramic Coating for Car Owners",
  description:
    "REVO, ION+ and HYDROPEL — AUTOTRIZ coatings formulated so a careful owner can apply them at home without professional equipment.",
};

const steps = [
  { k: "01", t: "Wash and decontaminate", d: "Strip everything off the paint. Iron fallout, tar, old wax." },
  { k: "02", t: "Dry and panel wipe", d: "The surface must be bare and completely dry before the coating touches it." },
  { k: "03", t: "Apply in sections", d: "Work one panel at a time in a crosshatch. Do not let it flash off." },
  { k: "04", t: "Level and cure", d: "Buff the high spots within the flash window, then keep it dry for 24 hours." },
];

export default async function ConsumerPage() {
  const items = await listProducts({ categorySlugs: ["consumer"] });

  return (
    <>
      <PageHero
        title="DIY"
        accent="Range"
        subhead="Professional chemistry, in your hands"
        lede="Three coatings built to be forgiving — longer flash windows and easier levelling, without dropping to a spray-and-wipe product."
        image="/photo/hero-car.webp"
        imageAlt="A ceramic-coated supercar"
      />

      <Band tone="white">
        <div className="shell">
          <Heading accent="Range" rule>
            The consumer
          </Heading>
          <div className="mt-14">
            <ProductGrid items={items} columns={3} />
          </div>
        </div>
      </Band>

      <Band tone="dark">
        <div className="shell">
          <Heading tone="light" accent="steps" rule subhead="The first two matter most">
            Four
          </Heading>
          <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal
                as="li"
                key={s.k}
                delay={i}
                className="border border-foreground/15 bg-card p-8 text-center"
              >
                <span className="display text-3xl text-primary">{s.k}</span>
                <h3 className="display mt-5 text-base text-foreground">{s.t}</h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
