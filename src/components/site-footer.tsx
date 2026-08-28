import Image from "next/image";
import Link from "next/link";
import { footerLegal, nav, type NavItem } from "@/lib/site";
import type { ShopSettings } from "@/lib/shop-settings";

export function SiteFooter({
  shopItems,
  shop,
}: {
  shopItems: NavItem[];
  shop: ShopSettings;
}) {
  // The Shop column comes from the categories chosen in the admin.
  const groups = [
    ...(shopItems.length ? [{ name: "Shop", items: shopItems }] : []),
    ...nav,
  ];
  return (
    <footer className="dark bg-card text-foreground/60">
      <div className="shell relative overflow-hidden py-20">
        {/* The circle mark, blown up and dropped to a whisper — the same
            watermark the current site carries in its footer. */}
        <Image
          src="/brand/mark-ink.png"
          alt=""
          aria-hidden
          width={509}
          height={566}
          className="pointer-events-none absolute -right-10 top-1/2 hidden w-80 -translate-y-1/2 opacity-[0.06] invert lg:block"
        />

        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Image
              src="/brand/autotriz-wordmark.png"
              alt="AUTOTRIZ"
              width={3339}
              height={729}
              className="h-11 w-auto"
            />
            <p className="mt-7 max-w-sm text-sm leading-relaxed">
              {shop.description}
            </p>
            <ul className="mt-8 flex flex-wrap gap-6">
              {shop.social.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="label transition-colors hover:text-primary"
                  >
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.name}>
                <p className="label text-primary">{group.name}</p>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm transition-colors hover:text-foreground"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="label text-primary">Contact</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <span className="block text-foreground/40">Studio</span>
                  {shop.city}, {shop.country}
                  {shop.address ? <span className="block">{shop.address}</span> : null}
                </li>
                {shop.phone ? (
                  <li>
                    <span className="block text-foreground/40">Phone</span>
                    <a href={`tel:${shop.tel}`} className="hover:text-foreground">
                      {shop.phone}
                    </a>
                  </li>
                ) : null}
                <li>
                  <span className="block text-foreground/40">Email</span>
                  <a href={`mailto:${shop.email}`} className="hover:text-foreground">
                    {shop.email}
                  </a>
                </li>
                <li>
                  <span className="block text-foreground/40">Hours</span>
                  {shop.hours}
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-primary text-primary-foreground">
        {/* On a narrow screen the legal links stack as a list rather
            than wrapping into a ragged block. */}
        <div className="shell flex flex-col gap-5 py-5 md:flex-row md:items-center md:justify-between md:gap-8 md:py-4">
          <p className="label leading-relaxed">
            © {new Date().getFullYear()} {shop.registered}
            <span className="hidden sm:inline"> — {shop.tagline}</span>
          </p>
          <ul className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-7 md:gap-y-2">
            {footerLegal.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="label transition-opacity hover:opacity-60"
                >
                  {l.name}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${shop.email}`}
                className="label transition-opacity hover:opacity-60"
              >
                {shop.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
