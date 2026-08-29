import type { Metadata } from "next";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { ShopBrowser } from "@/components/shop/shop-browser";
import { Band } from "@/components/ui";
import { parseShopParams } from "@/components/shop/shop-params";
import { getPage } from "@/lib/page-store";
import { trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "The full AUTOTRIZ automotive range: ceramic coatings, polishing compounds, surface preparation and after care.",
};

/** The first page is rendered on the server from the URL, so it is
 *  indexable and paints with data. After that the browser talks to the
 *  same tRPC procedures directly. */
export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const input = parseShopParams(await searchParams);

  const [results, facets] = await Promise.all([
    trpc.shop.search(input),
    trpc.shop.facets(),
  ]);
  const page = getPage("shop");

  return (
    <>
      <PageHero
        title={page.text("hero.title")}
        accent={page.text("hero.accent")}
        subhead={page.text("hero.subhead")}
        lede={page.text("hero.lede")}
      />

      <Band tone="white" className="py-12 md:py-16">
        <div className="shell">
          <ShopBrowser initialInput={input} initialResults={results} initialFacets={facets} />
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
