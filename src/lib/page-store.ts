import { PAGE_CONTENT, pick } from "@/lib/page-content";

/* The storefront's read side.
   
   This used to merge copy stored in the database over the shipped
   wording. The admin form that wrote that copy has been removed, so
   the shipped wording is all there is — which means no query, no
   `server-only`, and nothing to await. */

export type PageBag = Record<string, unknown>;

/** A reader bound to one page, so components can ask for `hero.title`. */
export function getPage(page: string) {
  const content = PAGE_CONTENT[page] ?? {};

  return {
    content,
    text: (path: string, fallback = "") => pick<string>(content, path, fallback),
    list: <T = Record<string, unknown>>(path: string) => pick<T[]>(content, path, [] as T[]),
  };
}
