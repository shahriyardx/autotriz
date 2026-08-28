"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartButton } from "@/components/cart/cart-button";
import { site, type HeaderEntry } from "@/lib/site";
import { cn } from "@/lib/cn";

export function SiteHeader({ nav: headerNav }: { nav: HeaderEntry[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);

  const close = () => {
    setDrawer(false);
    setOpen(null);
  };

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
  }, [drawer]);

  // Slide the header away on scroll down, bring it back on scroll up.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - last;
        if (y < 80) setHidden(false);
        else if (delta > 6) setHidden(true);
        else if (delta < -6) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "dark sticky top-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        hidden && !drawer && !open && "-translate-y-full",
      )}
      onMouseLeave={() => setOpen(null)}
    >
      {/* --- primary utility bar --- */}
      <div className="bg-primary text-primary-foreground">
        <div className="shell flex h-10 items-center justify-between gap-6">
          <p className="label hidden text-primary-foreground/70 sm:block">{site.tagline}</p>
          <div className="flex flex-1 items-center justify-end gap-6">
            <a
              href={`mailto:${site.email}`}
              className="label hidden text-primary-foreground/80 transition-colors hover:text-primary-foreground md:block"
            >
              {site.email}
            </a>
            <Link
              href="/account"
              className="label text-primary-foreground transition-opacity hover:opacity-70"
            >
              Account
            </Link>
            <CartButton className="label text-primary-foreground transition-opacity hover:opacity-70" />
          </div>
        </div>
      </div>

      {/* --- charcoal navigation bar --- */}
      <div className="bg-card">
        <div className="shell flex h-20 items-center justify-between gap-8">
          <Link href="/" onClick={close} aria-label="AUTOTRIZ home" className="shrink-0">
            <Image
              src="/brand/autotriz-wordmark.png"
              alt="AUTOTRIZ — Innovative Surface Creation"
              width={3339}
              height={729}
              priority
              className="h-10 w-auto md:h-11"
            />
          </Link>

          <nav className="hidden lg:flex lg:items-center">
            {headerNav.map((entry) =>
              entry.items ? (
                <button
                  key={entry.name}
                  type="button"
                  onMouseEnter={() => setOpen(entry.name)}
                  onFocus={() => setOpen(entry.name)}
                  onClick={() => setOpen(open === entry.name ? null : entry.name)}
                  aria-expanded={open === entry.name}
                  className={cn(
                    "relative px-5 py-7 text-[0.95rem] text-foreground/85 transition-colors hover:text-primary",
                    open === entry.name && "text-primary",
                  )}
                >
                  {entry.name}
                </button>
              ) : (
                <Link
                  key={entry.name}
                  href={entry.href}
                  onMouseEnter={() => setOpen(null)}
                  className="px-5 py-7 text-[0.95rem] text-foreground/85 transition-colors hover:text-primary"
                >
                  {entry.name}
                </Link>
              ),
            )}
          </nav>

          <button
            type="button"
            onClick={() => setDrawer((d) => !d)}
            aria-label={drawer ? "Close menu" : "Open menu"}
            aria-expanded={drawer}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={cn(
                "h-0.5 w-6 bg-background transition-transform duration-300",
                drawer && "translate-y-1 rotate-45",
              )}
            />
            <span
              className={cn(
                "h-0.5 w-6 bg-background transition-transform duration-300",
                drawer && "-translate-y-1 -rotate-45",
              )}
            />
          </button>
        </div>
      </div>

      {/* --- dropdown --- */}
      <div
        className={cn(
          "absolute inset-x-0 top-full hidden border-t border-border bg-popover/95 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.6)] backdrop-blur transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <div className="shell grid grid-cols-4 gap-3 py-6">
          {headerNav
            .find((entry) => entry.name === open)
            ?.items?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="group flex flex-col gap-2 rounded-md border border-transparent px-5 py-5 transition-colors hover:border-border hover:bg-accent"
              >
                <span className="display-tight flex items-center gap-2 text-base text-foreground transition-colors group-hover:text-primary">
                  {item.name}
                  <span
                    aria-hidden
                    className="opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                  >
                    →
                  </span>
                </span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  {item.note}
                </span>
              </Link>
            ))}
        </div>
      </div>

      {/* --- mobile drawer --- */}
      <div
        className={cn(
          "fixed inset-x-0 top-30 bottom-0 z-40 overflow-y-auto bg-card transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          drawer
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <div className="shell py-6">
          {headerNav.map((entry) => (
            <div key={entry.name} className="border-b border-foreground/10 py-5">
              {entry.items ? (
                <>
                  <p className="label text-primary">{entry.name}</p>
                  <ul className="mt-4 space-y-3">
                    {entry.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={close}
                          className="display-tight block text-lg text-foreground"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link
                  href={entry.href}
                  onClick={close}
                  className="display-tight block text-lg text-foreground"
                >
                  {entry.name}
                </Link>
              )}
            </div>
          ))}
          <Link
            href="/cart"
            onClick={close}
            className="label mt-8 flex items-center justify-center bg-primary px-6 py-5 text-primary-foreground"
          >
            View cart
          </Link>
        </div>
      </div>
    </header>
  );
}
