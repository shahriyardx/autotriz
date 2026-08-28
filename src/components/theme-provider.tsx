"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** There is no theme switch. The storefront is always light and the
 *  admin panel is always dark; the class lands on `<html>` so portalled
 *  menus, dialogs and toasts pick the right palette too. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const forcedTheme = pathname.startsWith("/admin") ? "dark" : "light";

  return (
    <NextThemesProvider
      attribute="class"
      forcedTheme={forcedTheme}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
