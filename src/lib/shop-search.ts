import { z } from "zod";

/* Shared between the browser (URL state, sidebar) and the server (tRPC
   router, catalogue queries). Deliberately free of any database import. */

export const sortKeys = ["featured", "newest", "price-asc", "price-desc", "name"] as const;
export type SortKey = (typeof sortKeys)[number];

export const PER_PAGE_OPTIONS = [12, 24, 48] as const;

export const shopSearchInput = z.object({
  q: z.string().trim().max(120).default(""),
  categories: z.array(z.string().trim().min(1)).max(50).default([]),
  surfaces: z.array(z.string().trim().min(1)).max(50).default([]),
  /** Whole currency units, as typed in the sidebar. */
  minPrice: z.number().min(0).nullable().default(null),
  maxPrice: z.number().min(0).nullable().default(null),
  inStock: z.boolean().default(false),
  onSale: z.boolean().default(false),
  featured: z.boolean().default(false),
  sort: z.enum(sortKeys).default("featured"),
  page: z.number().int().min(1).default(1),
  perPage: z
    .number()
    .int()
    .refine((n) => (PER_PAGE_OPTIONS as readonly number[]).includes(n))
    .default(24),
});

export type ShopSearchInput = z.input<typeof shopSearchInput>;

/** Can this product be added to the cart right now? Lives here rather
 *  than in `catalogue.ts` so client components can use it. */
export const inStock = (product: {
  stock: number;
  trackStock: boolean;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  backorders: "no" | "notify" | "yes";
}) =>
  product.trackStock
    ? product.stock > 0 || product.backorders !== "no"
    : product.stockStatus !== "outofstock";
