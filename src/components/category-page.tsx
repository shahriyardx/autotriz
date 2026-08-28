import Link from "next/link";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { ProductGrid } from "@/components/shop/product-grid";
import { Reveal } from "@/components/reveal";
import { Band, Heading } from "@/components/ui";
import { listCategories, listProducts } from "@/lib/catalogue";

export async function CategoryPage({
  slug,
  title,
  accent,
  subhead,
  lede,
  image,
  notes,
}: {
  slug: string;
  title: string;
  accent?: string;
  subhead?: string;
  lede: string;
  image?: string;
  notes: { k: string; v: string }[];
}) {
  const [items, allCategories] = await Promise.all([
    listProducts({ categorySlugs: [slug] }),
    listCategories(),
  ]);
  const others = allCategories.filter((c) => c.slug !== slug);

  return (
    <>
      <PageHero
        title={title}
        accent={accent}
        subhead={subhead}
        lede={lede}
        image={image}
        imageAlt={title}
      />

      <Band tone="white" className="py-14 md:py-16">
        <div className="shell">
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {notes.map((n) => (
              <div key={n.k} className="text-center">
                <dt className="label text-muted-foreground">{n.k}</dt>
                <dd className="display-tight mt-3 text-lg">{n.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Band>

      <Band tone="mist">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Heading align="left" size="sm" accent={`(${items.length})`}>
              Products
            </Heading>
            <Link
              href={`/shop?category=${slug}`}
              className="label border-b-2 border-primary pb-1 text-foreground"
            >
              Filter and sort →
            </Link>
          </div>
          <div className="mt-12">
            <ProductGrid items={items} />
          </div>
        </div>
      </Band>

      <Band tone="dark" className="py-20 md:py-24">
        <div className="shell">
          <Heading tone="light" size="sm">
            Explore the rest of the range
          </Heading>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((c, i) => (
              <Reveal as="li" key={c.id} delay={i}>
                <Link
                  href={c.href}
                  className="group flex h-full flex-col border border-foreground/15 bg-card p-7 text-center transition-colors hover:border-primary"
                >
                  <h3 className="display text-base text-foreground transition-colors group-hover:text-primary">
                    {c.name}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/55">
                    {c.blurb}
                  </p>
                  <p className="label mt-6 text-foreground/40">
                    {c.productCount} products
                  </p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
