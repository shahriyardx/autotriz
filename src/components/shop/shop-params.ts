import { PER_PAGE_OPTIONS, sortKeys, type ShopSearchInput, type SortKey } from "@/lib/shop-search";

/* The shop's filter state lives in the URL. These two functions are the
   only place that shape is defined, so the server page and the browser
   always agree on it. */

export type ShopState = Required<ShopSearchInput>;

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) =>
  v === undefined ? [] : (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(",")).filter(Boolean);
const num = (v: string | undefined) => {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const defaultShopState: ShopState = {
  q: "",
  categories: [],
  surfaces: [],
  minPrice: null,
  maxPrice: null,
  inStock: false,
  onSale: false,
  featured: false,
  sort: "featured",
  page: 1,
  perPage: 24,
};

export function parseShopParams(params: Params): ShopState {
  const sort = one(params.sort);
  const perPage = Number(one(params.per));
  const page = Number(one(params.page));
  return {
    q: one(params.q)?.trim() ?? "",
    categories: many(params.category),
    surfaces: many(params.surface),
    minPrice: num(one(params.min)),
    maxPrice: num(one(params.max)),
    inStock: one(params.stock) === "in",
    onSale: one(params.sale) === "1",
    featured: one(params.featured) === "1",
    sort: sortKeys.includes(sort as SortKey) ? (sort as SortKey) : "featured",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(perPage) ? perPage : 24,
  };
}

/** Only non-default values are written, so a clean shop has a clean URL. */
export function toSearchString(state: ShopState): string {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  if (state.categories.length) p.set("category", state.categories.join(","));
  if (state.surfaces.length) p.set("surface", state.surfaces.join(","));
  if (state.minPrice !== null) p.set("min", String(state.minPrice));
  if (state.maxPrice !== null) p.set("max", String(state.maxPrice));
  if (state.inStock) p.set("stock", "in");
  if (state.onSale) p.set("sale", "1");
  if (state.featured) p.set("featured", "1");
  if (state.sort !== "featured") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  if (state.perPage !== 24) p.set("per", String(state.perPage));
  return p.toString();
}
