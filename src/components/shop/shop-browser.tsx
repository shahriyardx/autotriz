"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { api } from "@/trpc/react";
import type { ShopFacets } from "@/lib/catalogue";
import { formatPrice } from "@/lib/shop-config";
import { ProductGrid } from "@/components/shop/product-grid";
import {
  defaultShopState,
  parseShopParams,
  toSearchString,
  type ShopState,
} from "@/components/shop/shop-params";
import { PER_PAGE_OPTIONS } from "@/lib/shop-search";
import { cn } from "@/lib/cn";

type Results = {
  items: Parameters<typeof ProductGrid>[0]["items"];
  total: number;
  page: number;
  pages: number;
  perPage: number;
};

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

const activeCount = (s: ShopState) =>
  (s.q ? 1 : 0) +
  s.categories.length +
  s.surfaces.length +
  (s.minPrice !== null || s.maxPrice !== null ? 1 : 0) +
  (s.inStock ? 1 : 0) +
  (s.onSale ? 1 : 0) +
  (s.featured ? 1 : 0);

/* ==================================================================
   ShopBrowser — the whole shop below the hero. Filter state is the
   URL; every change is a tRPC query, so a shared link shows the same
   page, and the server-rendered first page is reused as initial data.
   ================================================================== */

export function ShopBrowser({
  initialInput,
  initialResults,
  initialFacets,
}: {
  initialInput: ShopState;
  initialResults: Results;
  initialFacets: ShopFacets;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = useMemo(
    () => parseShopParams(Object.fromEntries(params.entries())),
    [params],
  );
  const isInitial = toSearchString(state) === toSearchString(initialInput);

  const results = api.shop.search.useQuery(state, {
    initialData: isInitial ? initialResults : undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  const facets = api.shop.facets.useQuery(undefined, {
    initialData: initialFacets,
    staleTime: 5 * 60_000,
  });

  const set = useCallback(
    (patch: Partial<ShopState>, options: { keepPage?: boolean } = {}) => {
      const next: ShopState = { ...state, ...patch };
      if (!options.keepPage) next.page = 1;
      const qs = toSearchString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, pathname, router],
  );

  const goToPage = (page: number) => {
    set({ page }, { keepPage: true });
    document.getElementById("shop-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleIn = (key: "categories" | "surfaces", value: string) => {
    const list = state[key];
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  const data = results.data ?? initialResults;
  const f = facets.data ?? initialFacets;
  const active = activeCount(state);

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* ============================ SIDEBAR ============================ */}
      <aside className={cn("lg:block", filtersOpen ? "block" : "hidden")}>
        <div className="space-y-8 lg:sticky lg:top-36">
          <div className="flex items-center justify-between">
            <p className="display text-base">Filters</p>
            {active ? (
              <button
                type="button"
                onClick={() => set({ ...defaultShopState, sort: state.sort, perPage: state.perPage })}
                className="label text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Clear all ({active})
              </button>
            ) : null}
          </div>

          <SearchBox value={state.q} onChange={(q) => set({ q })} />

          <FilterSection title="Price">
            <PriceRange
              bounds={f.price}
              min={state.minPrice}
              max={state.maxPrice}
              onChange={(minPrice, maxPrice) => set({ minPrice, maxPrice })}
            />
          </FilterSection>

          <FilterSection title="Categories">
            <CategoryTree
              categories={f.categories}
              selected={state.categories}
              onToggle={(slug) => toggleIn("categories", slug)}
            />
          </FilterSection>

          <FilterSection title="Surface">
            <ul className="space-y-2.5">
              {f.surfaces.map((s) => (
                <li key={s.surface}>
                  <CheckRow
                    label={s.surface}
                    count={s.count}
                    checked={state.surfaces.includes(s.surface)}
                    onChange={() => toggleIn("surfaces", s.surface)}
                  />
                </li>
              ))}
            </ul>
          </FilterSection>

          <FilterSection title="Availability">
            <ul className="space-y-2.5">
              <li>
                <CheckRow label="In stock" count={f.inStock} checked={state.inStock} onChange={() => set({ inStock: !state.inStock })} />
              </li>
              <li>
                <CheckRow label="On sale" count={f.onSale} checked={state.onSale} onChange={() => set({ onSale: !state.onSale })} />
              </li>
              <li>
                <CheckRow label="Featured" count={f.featured} checked={state.featured} onChange={() => set({ featured: !state.featured })} />
              </li>
            </ul>
          </FilterSection>
        </div>
      </aside>

      {/* ============================ RESULTS ============================ */}
      <div id="shop-results" className="scroll-mt-36">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="label inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2.5 transition-colors hover:border-foreground lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters{active ? ` (${active})` : ""}
            </button>
            <p className="label text-muted-foreground" aria-live="polite">
              {results.isFetching && !results.isPlaceholderData ? "Loading…" : null}
              {data.total === 0
                ? "No products"
                : `${(data.page - 1) * data.perPage + 1}–${Math.min(data.page * data.perPage, data.total)} of ${data.total} products`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2.5">
              <span className="label text-muted-foreground">Sort</span>
              <select
                value={state.sort}
                onChange={(e) => set({ sort: e.target.value as ShopState["sort"] })}
                className="rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2.5">
              <span className="label text-muted-foreground">Show</span>
              <select
                value={state.perPage}
                onChange={(e) => set({ perPage: Number(e.target.value) })}
                className="rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* active filter chips */}
        {active ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {state.q ? <Chip label={`“${state.q}”`} onRemove={() => set({ q: "" })} /> : null}
            {state.categories.map((slug) => (
              <Chip
                key={slug}
                label={f.categories.find((c) => c.slug === slug)?.name ?? slug}
                onRemove={() => toggleIn("categories", slug)}
              />
            ))}
            {state.surfaces.map((s) => (
              <Chip key={s} label={s} onRemove={() => toggleIn("surfaces", s)} />
            ))}
            {state.minPrice !== null || state.maxPrice !== null ? (
              <Chip
                label={`${state.minPrice !== null ? formatPrice(state.minPrice * 100) : "৳0"} – ${state.maxPrice !== null ? formatPrice(state.maxPrice * 100) : "any"}`}
                onRemove={() => set({ minPrice: null, maxPrice: null })}
              />
            ) : null}
            {state.inStock ? <Chip label="In stock" onRemove={() => set({ inStock: false })} /> : null}
            {state.onSale ? <Chip label="On sale" onRemove={() => set({ onSale: false })} /> : null}
            {state.featured ? <Chip label="Featured" onRemove={() => set({ featured: false })} /> : null}
          </ul>
        ) : null}

        <div
          className={cn(
            "mt-8 transition-opacity duration-200",
            results.isFetching && results.isPlaceholderData && "opacity-50",
          )}
        >
          <ProductGrid items={data.items} columns={3} />
        </div>

        <Pagination page={data.page} pages={data.pages} onPage={goToPage} />
      </div>
    </div>
  );
}

/* ==================================================================
   Pieces
   ================================================================== */

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-6">
      <h3 className="label mb-4 text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
  indent = 0,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  indent?: number;
}) {
  return (
    <label
      className="flex cursor-pointer items-center gap-3 text-sm text-foreground/80 transition-colors hover:text-foreground"
      style={{ paddingLeft: indent * 16 }}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-primary" />
      <span className="flex-1">{label}</span>
      {typeof count === "number" ? (
        <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
      ) : null}
    </label>
  );
}

function CategoryTree({
  categories,
  selected,
  onToggle,
}: {
  categories: ShopFacets["categories"];
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const byParent = useMemo(() => {
    const m = new Map<string | null, ShopFacets["categories"]>();
    for (const c of categories) m.set(c.parentId, [...(m.get(c.parentId) ?? []), c]);
    return m;
  }, [categories]);

  const render = (parentId: string | null, depth: number): React.ReactNode =>
    (byParent.get(parentId) ?? []).map((c) => (
      <li key={c.id}>
        <CheckRow
          label={c.name}
          count={c.count}
          indent={depth}
          checked={selected.includes(c.slug)}
          onChange={() => onToggle(c.slug)}
        />
        {byParent.get(c.id)?.length ? (
          <ul className="mt-2.5 space-y-2.5">{render(c.id, depth + 1)}</ul>
        ) : null}
      </li>
    ));

  return <ul className="space-y-2.5">{render(null, 0)}</ul>;
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  // Adopt a new URL value (e.g. "Clear all") without an effect.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setDraft(value);
  }
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft.trim()), 400);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="w-full rounded-sm border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </div>
  );
}

function PriceRange({
  bounds,
  min,
  max,
  onChange,
}: {
  bounds: { min: number; max: number };
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const lo = Math.floor(bounds.min / 100);
  const hi = Math.ceil(bounds.max / 100);
  const [a, setA] = useState(min ?? lo);
  const [b, setB] = useState(max ?? hi);
  // Adopt new URL values (chips, "Clear all") without an effect.
  const [seen, setSeen] = useState({ min, max, lo, hi });
  if (seen.min !== min || seen.max !== max || seen.lo !== lo || seen.hi !== hi) {
    setSeen({ min, max, lo, hi });
    setA(min ?? lo);
    setB(max ?? hi);
  }

  const commit = (nextA: number, nextB: number) => {
    const low = Math.min(nextA, nextB);
    const high = Math.max(nextA, nextB);
    onChange(low <= lo ? null : low, high >= hi ? null : high);
  };

  const pct = (v: number) => (hi === lo ? 0 : ((v - lo) / (hi - lo)) * 100);

  return (
    <div className="space-y-4">
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-border" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-primary"
          style={{ left: `${pct(Math.min(a, b))}%`, right: `${100 - pct(Math.max(a, b))}%` }}
        />
        {[
          { v: a, setV: setA, other: b },
          { v: b, setV: setB, other: a },
        ].map((h, i) => (
          <input
            key={i}
            type="range"
            min={lo}
            max={hi}
            step={1}
            value={h.v}
            aria-label={i === 0 ? "Minimum price" : "Maximum price"}
            onChange={(e) => h.setV(Number(e.target.value))}
            onMouseUp={() => commit(a, b)}
            onTouchEnd={() => commit(a, b)}
            onKeyUp={() => commit(a, b)}
            className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background"
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex flex-1 items-center gap-1 rounded-sm border border-border px-2 py-1.5 text-sm focus-within:border-primary">
          <span className="text-muted-foreground">৳</span>
          <input
            type="number"
            min={lo}
            max={hi}
            value={a}
            aria-label="Minimum price"
            onChange={(e) => setA(Number(e.target.value))}
            onBlur={() => commit(a, b)}
            onKeyDown={(e) => e.key === "Enter" && commit(a, b)}
            className="w-full bg-transparent outline-none"
          />
        </label>
        <span className="text-muted-foreground">–</span>
        <label className="flex flex-1 items-center gap-1 rounded-sm border border-border px-2 py-1.5 text-sm focus-within:border-primary">
          <span className="text-muted-foreground">৳</span>
          <input
            type="number"
            min={lo}
            max={hi}
            value={b}
            aria-label="Maximum price"
            onChange={(e) => setB(Number(e.target.value))}
            onBlur={() => commit(a, b)}
            onKeyDown={(e) => e.key === "Enter" && commit(a, b)}
            className="w-full bg-transparent outline-none"
          />
        </label>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="rounded p-0.5 hover:bg-background">
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;

  // 1 … p-1 p p+1 … n
  const items: (number | "…")[] = [];
  for (let i = 1; i <= pages; i += 1) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items[items.length - 1] !== "…") items.push("…");
  }

  const btn =
    "grid h-10 min-w-10 place-items-center rounded-sm border px-2 text-sm transition-colors disabled:opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={cn(btn, "border-border hover:border-foreground")} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {items.map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(btn, item === page ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
          >
            {item}
          </button>
        ),
      )}
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} className={cn(btn, "border-border hover:border-foreground")} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
