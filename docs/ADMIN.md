# Admin panel

Lives at `/admin`, inside the same Next.js app as the storefront. Storefront
routes are in `src/app/(site)/`, admin routes in `src/app/admin/`, and the two
have separate layouts so neither inherits the other's chrome.

## Getting in

Local database runs in Docker:

```bash
docker compose up -d              # Postgres 17 on port 5434 (compose.yml)
pnpm db:push                      # apply schema changes
pnpm db:seed                      # catalogue + first admin account
pnpm dev
```

Then open http://localhost:3000/admin

```
admin@auto-triz.com
autotriz-admin-2026
```

**Change that password before this is deployed anywhere.** Override the seed
defaults with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## What is built

| Screen | State |
|---|---|
| Dashboard | Revenue, order count, product count, open enquiries, recent orders, low stock, best sellers |
| Orders | Filter by status, order detail, change status |
| Products | Search, create, edit, publish/hide, delete, stock and pricing |
| Categories | Create, edit, delete (blocked while products still reference it) |
| Enquiries | Contact form and newsletter sign-ups, mark handled |
| Staff | Lists accounts and roles |
| Discounts | Table exists; the UI is a placeholder |
| Settings | Read-only view of shop configuration |

## How it is wired

- **Auth** — `better-auth` with the `admin` plugin, Drizzle adapter, email and
  password. Its tables are generated into `src/db/auth-schema.ts`; do not hand
  edit them except where a comment says otherwise.
- **Guard** — pages call `requireAdmin()` from `src/lib/admin-guard.ts`;
  mutations go through tRPC's `adminProcedure`. Neither relies on middleware,
  because an endpoint being reachable only from an admin screen proves nothing.
- **API** — tRPC. Routers in `src/server/api/routers/`, mounted in
  `src/server/api/root.ts`, served at `/api/trpc`. Client components use
  `api.*` from `src/trpc/react.tsx`; server components can call
  `trpc.*` from `src/trpc/server.ts` with no HTTP hop.
- **Forms** — react-hook-form with `zodResolver`, following shadcn's documented
  pattern: `Controller` wrapping `Field` / `FieldLabel` / `FieldError`. The
  validation schemas in `src/server/api/schemas.ts` are shared with the
  routers, so the browser and the server enforce the same rules.
- **UI** — shadcn/ui in `src/components/ui-kit/`, sidebar from the `sidebar-07`
  block. The admin runs **permanently dark**; the storefront is
  permanently light. Both palettes live in `globals.css` and never overlap —
  the storefront uses brand tokens (`--color-yellow`, `--color-charcoal`),
  shadcn uses its own (`--background`, `--border`).
- **Images** — Cloudflare R2. See below.

## Product images

Multi-image, stored in R2, ordered by drag and drop. The first image in the
list is the one the shop uses as the main shot.

The upload never passes through this server: the browser asks tRPC for a
presigned `PUT`, sends the file straight to R2, then reports the key back so it
can be recorded against the product. Deleting an image removes the row and the
object, and promotes the next image to main if the deleted one was it.

Configure with five variables:

```
R2_ENDPOINT      https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY
R2_SECRET_KEY
R2_BUCKET
R2_PUBLIC_URL    the public/CDN domain for the bucket
```

Miss any of them and the uploader shows an honest "not connected" notice
instead of failing on click. The bucket's public hostname also has to be listed
in `next.config.ts` under `images.remotePatterns` — it is read from
`R2_PUBLIC_URL`.

> **The current keys are temporary** and point at a `ccbot` bucket that is not
> AUTOTRIZ's. Swap in the real bucket and rotate the keys before launch.

## Money

Prices are stored as **integer minor units** (poisha). `14900` is ৳149.00.
Never store money as a float. `formatPrice()` in `src/lib/shop-config.ts` is
the only place that converts for display.

## Migrations

The schema is versioned, not pushed:

```bash
pnpm db:generate   # write a new SQL migration from schema changes
pnpm db:migrate    # apply pending migrations (safe to re-run, safe on deploy)
```

Drizzle records what it has applied in `drizzle.__drizzle_migrations`. The
migration files in `drizzle/` are the source of truth — commit them.
`pnpm db:push` still exists for throwaway experiments; do not use it on
anything you care about.

## Still to do

- Inviting staff from the Staff screen.
- Discount codes: creating them, and applying them at checkout.
- Editable settings — the `settings` table is there, the UI reads from config.
- A Stripe webhook that writes paid orders into the `orders` table. Until that
  exists the Orders screen has nothing to show.
