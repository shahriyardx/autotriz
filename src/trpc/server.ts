import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/** Calls procedures straight from a server component — same validation
 *  and same auth checks, without the HTTP round trip. */
const context = cache(async () =>
  createTRPCContext({ headers: new Headers(await headers()) }),
);

export const trpc = createCaller(context);
