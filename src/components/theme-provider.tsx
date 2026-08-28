"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/** There is no theme switch. The storefront is always light; the admin
 *  panel and the visualizer are always dark. The class lands on
 *  `<html>` so portalled menus, dialogs and toasts follow too. */
const ALWAYS_DARK = ["/admin", "/visualizer"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const forcedTheme = ALWAYS_DARK.some((p) => pathname.startsWith(p)) ? "dark" : "light";

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
