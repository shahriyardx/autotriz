import Image from "next/image";
import Link from "next/link";
import { footerLegal, nav, office, site, social, type NavItem } from "@/lib/site";

export function SiteFooter({ shopItems }: { shopItems: NavItem[] }) {
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
              {site.description}
            </p>
            <ul className="mt-8 flex flex-wrap gap-6">
              {social.map((s) => (
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
                  {office.city}, {office.country}
                  {office.address ? <span className="block">{office.address}</span> : null}
                </li>
                {office.phone ? (
                  <li>
                    <span className="block text-foreground/40">Phone</span>
                    <a href={`tel:${office.tel}`} className="hover:text-foreground">
                      {office.phone}
                    </a>
                  </li>
                ) : null}
                <li>
                  <span className="block text-foreground/40">Email</span>
                  <a href={`mailto:${site.email}`} className="hover:text-foreground">
                    {site.email}
                  </a>
                </li>
                <li>
                  <span className="block text-foreground/40">Hours</span>
                  {office.hours}
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <div className="bg-primary text-primary-foreground">
        <div className="shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <p className="label">
            © {new Date().getFullYear()} {site.registered} — {site.tagline}
          </p>
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
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
                href={`mailto:${site.email}`}
                className="label transition-opacity hover:opacity-60"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
