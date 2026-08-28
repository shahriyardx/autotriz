# auto-triz.com — Site Audit (2026-08-21)

> **SCOPE DECISION (2026-08-21): AUTOMOTIVE ONLY.**
> Rebuild covers **cars only**. No marine, no aviation, no motorcycle, no PPF, no solar.
> Everything below marked ~~struck~~ or "OUT" is reference-only — do not build it.

## What the business is
AUTOTRIZ — manufacturer of nano ceramic coatings + specialty chemicals.
Core tech: Polysilazane binders (OPSZ = hydrophobic, PHPS = hydrophilic). "3D matrix nano structure", hardness >9H.
Markets in rebuild: **Automotive only (cars)**. OUT of scope: marine, aviation, motorcycle, Paint Protection Film (vertek films), Solar PV (solar-triz.com).
Claims: ISO 9001:2015, TÜV SÜD + SGS tested, REACH compliant, SVHC-free. R&D in DE/JP/KR/TW/FR/US.
Numbers used as social proof: 500+ authorized detailers, 500,000+ coatings sold, 60+ countries, $100B+ assets protected.

## Current tech stack
- **Wix** (Wix.com Website Builder, Pepyaka server, parastorage/wixstatic CDN)
- Wix apps in use: Stores (Cart, Checkout & Orders), **Members Area**, **SparkLayer B2B & Wholesale**, Wix CMS (Data Binding), Wix Blog, Wix FAQ, Wix Chat, Wix Forms, Pro Gallery, Store Location Map / Located Map, Cookie Policy Banner, Do Not Sell Data
- Marketing: Google Ads + retargeting, Facebook Server Side Events
- **Multilingual: 17 locales** (ar, de, es, fr, id, it, ja, ko, ms, pl, pt, ru, th, tr, vi, zh + en)
- Fonts: Montserrat (primary), Roboto, Fahkwang (display)
- Palette: black / white / grey (#000, #2A2A2A, #545454, #666, #FFF). No strong accent brand color in markup.

## Key architectural fact
Products render with `price: "0"` and `availability: OutOfStock` in public JSON-LD.
=> Real pricing is **gated behind member login (B2B wholesale via SparkLayer)**. Public site = catalog; logged-in dealers = wholesale store.
The "Webmaster Login" nav link is that member login.

## Page inventory — IN SCOPE (15 pages; /marine + /aviation dropped)
| URL | Purpose |
|---|---|
| `/` | Home — hero "UNBEATABLE CERAMIC COATING", automotive focus, applicator locator CTA |
| `/about` | Company, R&D, polysilazane tech, certs |
| `/automotive-ceramic-coating` | Automotive product line |
| `/consumer-ceramic-coating` | Consumer line (REVO, ION+, HYDROPEL) |
| `/after-care` | Consumer maintenance products |
| `/polishing-compound` | Pro compounds |
| `/surface-preparation` | Pro prep chemicals |
| `/private-label` | OEM/private label program |
| `/join-us` | **Applicator** program + form |
| `/become-an-applicator` | **Distributor** program + form (URL is misnamed vs content) |
| `/resources` | Marketing asset downloads (logo, brochure, banners, posters, product images) |
| `/contact` | Contact |
| `/privacy-policy`, `/terms`, `/return-refund-policy` | Legal |

## Store (25 SKUs, 5 categories)
Categories: all-products, best-seller, automotive-ceramic-coating, automotive-polishing-compounds, automotive-clean-prep-maintain

Coatings: 3D Matrix Hybrid, 3D Matrix Pro (AT-V1P-50), 3D Matrix Ultra, Top Coat v2.0, Plastic & Trim, Wheel & Caliper, Glass Pro, Glass Lite, Leather & Vinyl, Fabric & Textile
Compounds: Heavy Cut (AT-PC-901), Extreme Cut, Ultra Cut, Final Cut, Ultimate Polish, Supreme Polish
Prep/Clean/Maintain: Surface Prep, Iron Remover, Water Spot Remover, Ultra Degreaser, All Purpose Cleaner, Glass Cleaner, Rich Foam Shampoo, Hyper Wheel Cleaner 4L, Quick Coat (AT-CC-QC-4)

**OUT OF SCOPE — do not build:** marine line (3D Matrix Gel Coat, 3D Matrix Urethane, Top Coat Marine, PVC & CSM Hypalon, Metal & Steel, Wood & Deck, Glass & Windshield, Vinyl & Cushion, Fabric & Canvas) and aviation-only Nano Serum. Listed here as reference only.

All 25 store SKUs above are automotive => all stay in scope.

## Audience segments (site is built around these 4)
1. **End consumers** — buy REVO / ION+ / HYDROPEL DIY line
2. **Professional applicators/detailers** — apply for certification, get leads, listed in locator
3. **Distributors** — territory contract, wholesale pricing, min annual purchase, 1yr then 3yr exclusive
4. **Private label / OEM buyers** — no startup cost, low MOQ, NDA, 2,000 units/hour capacity

## Contact
info@auto-triz.com
North America +1 (780) 297 5263 · Europe +44 20 4577 3784 · Middle East +971 56 109 9961 · Asia +6018 230 3999
Social: fb/autotrizworld · ig/@autotrizofficial · yt/@autotrizofficial

## Scope summary
IN: automotive ceramic coating (pro + consumer), polishing compounds, surface prep, after care, applicator/distributor/private-label programs, store, members B2B.
OUT: marine, aviation, motorcycle, PPF, solar PV.

## Rebuild must-haves
- 17-language i18n
- Automotive-only nav (no Industry dropdown needed — flatten it)
- Member login + B2B wholesale pricing (SparkLayer replacement)
- Product catalog with CMS (25+ SKUs, multi-industry variants)
- Applicator/distributor locator map
- 4 lead-gen forms (applicator, distributor, private label, contact)
- Gated resource/asset downloads
- Blog + FAQ
- GA/Google Ads + Meta CAPI tracking, cookie consent, CCPA "do not sell"
