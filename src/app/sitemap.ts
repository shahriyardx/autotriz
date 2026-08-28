import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/catalogue";
import { site } from "@/lib/site";

const routes = [
  "",
  "/about",
  "/automotive-ceramic-coating",
  "/polishing-compound",
  "/surface-preparation",
  "/after-care",
  "/consumer-ceramic-coating",
  "/services",
  "/services/ppf-installation",
  "/services/window-tint",
  "/services/car-polish",
  "/services/car-wash",
  "/resources",
  "/contact",
  "/shop",
  "/privacy-policy",
  "/terms",
  "/return-refund-policy",
];

/* The product list comes from the database, which is not reachable when
   the image is built. Generating this per request keeps the build free
   of database access and the sitemap always current. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();
  return [
    ...routes.map((path) => ({
      url: `${site.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...products.map((p) => ({
      url: `${site.url}/products/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
