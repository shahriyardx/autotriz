import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { searchProducts, shopFacets } from "@/lib/catalogue";
import { shopSearchInput } from "@/lib/shop-search";

/** Everything the storefront shop page asks for. Public — no session. */

export const shopRouter = createTRPCRouter({
  search: publicProcedure.input(shopSearchInput).query(async ({ input }) => {
    const { items, total } = await searchProducts({
      search: input.q,
      categorySlugs: input.categories,
      surfaces: input.surfaces,
      minPrice: input.minPrice === null ? undefined : Math.round(input.minPrice * 100),
      maxPrice: input.maxPrice === null ? undefined : Math.round(input.maxPrice * 100),
      inStockOnly: input.inStock,
      onSaleOnly: input.onSale,
      featuredOnly: input.featured,
      sort: input.sort,
      limit: input.perPage,
      offset: (input.page - 1) * input.perPage,
    });

    const pages = Math.max(1, Math.ceil(total / input.perPage));
    return { items, total, page: Math.min(input.page, pages), pages, perPage: input.perPage };
  }),

  facets: publicProcedure.query(() => shopFacets()),
});
