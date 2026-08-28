import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as appSchema from "./schema";
import * as authSchema from "./auth-schema";

const schema = { ...appSchema, ...authSchema };

/* ==================================================================
   The connection is opened on first use, not when this module loads.

   `next build` imports every route to collect its metadata, and there
   is no database at build time — a connection made up front would take
   the whole build down. Waiting until a query actually runs also means
   `DATABASE_URL` is only demanded when it is genuinely needed.

   Next.js reloads modules on every edit in development, so the handle
   is cached on `globalThis`; otherwise each edit would open another
   pool until Postgres refused more.
   ================================================================== */

const globalForDb = globalThis as unknown as {
  __autotrizSql?: ReturnType<typeof postgres>;
  __autotrizDb?: ReturnType<typeof drizzle<typeof schema>>;
};

/** Somewhere unreachable. `next build` imports every route to collect
 *  its metadata, and better-auth's adapter reads this handle as it is
 *  set up — but nothing queries during a build, so a client that could
 *  never connect is enough. The entrypoint refuses to start the server
 *  without a real `DATABASE_URL`. */
const NO_DATABASE = "postgres://unset:unset@127.0.0.1:1/unset";

function connection() {
  if (globalForDb.__autotrizSql) return globalForDb.__autotrizSql;

  const client = postgres(process.env.DATABASE_URL ?? NO_DATABASE, {
    max: process.env.NODE_ENV === "production" ? 10 : 3,
    prepare: false,
  });

  globalForDb.__autotrizSql = client;
  return client;
}

function database() {
  globalForDb.__autotrizDb ??= drizzle(connection(), { schema });
  return globalForDb.__autotrizDb;
}

/* Both exports stay plain objects to their callers. The proxies only
   defer the work of building them until the first property is read. */

export const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  apply: (_target, thisArg, args: Parameters<ReturnType<typeof postgres>>) =>
    Reflect.apply(connection(), thisArg, args),
  get: (_target, property, receiver) => Reflect.get(connection(), property, receiver),
  has: (_target, property) => Reflect.has(connection(), property),
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get: (_target, property, receiver) => Reflect.get(database(), property, receiver),
  has: (_target, property) => Reflect.has(database(), property),
});

export { schema };
