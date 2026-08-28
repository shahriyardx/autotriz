import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pageContent } from "@/db/schema";
import { PAGE_DEFAULTS, mergeContent, pick } from "@/lib/page-content";

/* The storefront's read side. Stored copy wins; anything blank falls
   back to the wording the site shipped with, so a page is never empty. */

export type PageBag = Record<string, unknown>;

export async function getPageContent(page: string): Promise<PageBag> {
  const defaults = PAGE_DEFAULTS[page] ?? {};
  const [row] = await db
    .select({ content: pageContent.content })
    .from(pageContent)
    .where(eq(pageContent.page, page))
    .limit(1);

  return mergeContent(defaults, row?.content);
}

/** A reader bound to one page, so components can ask for `hero.title`. */
export async function getPage(page: string) {
  const content = await getPageContent(page);
  return {
    content,
    text: (path: string, fallback = "") => pick<string>(content, path, fallback),
    list: <T = Record<string, unknown>>(path: string) => pick<T[]>(content, path, [] as T[]),
  };
}
