import type { Metadata, Viewport } from "next";
import { Montserrat, Roboto } from "next/font/google";
import { site } from "@/lib/site";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Headings. Montserrat is what the current site sets its uppercase
// headings in, and it is the half of the pairing people recognise.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

// Body copy.
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.promise} for automotive`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.promise}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2c2c2c",
  colorScheme: "light",
};

/** Root layout holds the document and the fonts only. The storefront
 *  chrome lives in `(site)/layout.tsx`; the admin panel has its own. */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${roboto.variable} h-full`}
    >
      <body className="min-h-full">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
