"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, MapPin, Package, User } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/details", label: "My details", icon: User },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="lg:sticky lg:top-32 lg:h-fit">
      <div className="border-b border-border pb-5">
        <p className="display text-base">{name}</p>
        <p className="mt-1 break-all text-sm text-muted-foreground">{email}</p>
      </div>

      <nav className="mt-5">
        <ul className="space-y-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/account"
                ? pathname === "/account"
                : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-foreground/75 hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
          className="mt-5 flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-foreground/75 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </nav>
    </aside>
  );
}
