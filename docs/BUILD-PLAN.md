# Build plan

## Phase 1 — site and storefront ✅ done

| Route | Notes |
|---|---|
| `/` | Hero, intro, 3-up range showcase, numbers, why AUTOTRIZ, certifications |
| `/about` | Chemistry, numbers, manufacturing, certifications |
| `/automotive-ceramic-coating` | 10 products |
| `/polishing-compound` | 6 products |
| `/surface-preparation` | 4 products |
| `/after-care` | 5 products |
| `/consumer-ceramic-coating` | REVO · ION+ · HYDROPEL, plus application steps |
| `/products/[slug]` | 28 pages, statically generated, add-to-cart |
| `/cart`, `/order/success` | Cart review and confirmation |
| `/resources` | Documentation library |
| `/contact` | Four regional desks + form |
| `/privacy-policy`, `/terms`, `/return-refund-policy` | Verbatim legal copy |
| `/sitemap.xml`, `/robots.txt`, 404 | Generated |

Removed on request: applicator programme, distributor programme, private
label, and the applicator locator.

## Phase 2 — make the store real

Nothing here is hard; it is all blocked on information rather than on code.

1. **Real prices.** Replace the numbers in `src/lib/products.ts` and set
   `PLACEHOLDER_PRICING = false`.
2. **Stripe keys.** Set `STRIPE_SECRET_KEY`. The Checkout session already
   builds line items from the server-side catalogue.
3. **Shipping and tax.** Decide the zones and rates, then add
   `shipping_options` and `automatic_tax` to the session in
   `src/app/api/checkout/route.ts`.
4. **Order email.** `POST /api/enquiry` currently validates and logs. Point it
   and the Stripe webhook at a transactional mail provider.
5. **HYDROPEL pack shot** — see the note in the README.

## Phase 3 — the 3D hero

Decision already taken: **one car in the hero, light 3D accents elsewhere.**
Not a full-page 3D scene — it stays fast on phones and it cannot take the whole
page down when it fails.

1. Source a free car model. CC0 or CC-BY glTF from Poly Pizza, Sketchfab's CC0
   filter, or the Khronos sample models. Record the licence in this repo.
2. Compress with `gltf-transform` (Draco or Meshopt) — budget under 3 MB.
3. Mount an R3F canvas in the hero block in `src/app/page.tsx`. The section is
   already sized for it and already has the still photograph as its fallback.
4. Drive rotation and a gloss sweep from scroll progress.
5. Fall back to the photograph on mobile, on reduced-motion, and wherever WebGL
   is unavailable.

## Phase 4 — internationalisation

The current site publishes 17 locales: ar, de, es, fr, id, it, ja, ko, ms, pl,
pt, ru, th, tr, vi, zh and en. Arabic means the layout has to survive RTL, so
audit the banner and footer before committing to a translation workflow.
