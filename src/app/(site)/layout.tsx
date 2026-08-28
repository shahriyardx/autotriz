import { CartProvider } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { menuCategories } from "@/lib/catalogue";
import { buildHeaderNav } from "@/lib/site";
import { TRPCProvider } from "@/trpc/react";

/* The storefront reads live prices, stock and editable page content, so
   every page is rendered per request. It also keeps the database out of
   `next build`, which runs where no database exists. */
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // The shop menu is whatever the admin ticked, read fresh each request.
  const shopItems = await menuCategories();

  return (
    <TRPCProvider>
    <CartProvider>
      <div className="flex min-h-full flex-col">
        <SiteHeader nav={buildHeaderNav(shopItems)} />
        <main className="relative z-10 flex-1">{children}</main>
        <SiteFooter shopItems={shopItems} />
        <CartDrawer />
      </div>
    </CartProvider>
    </TRPCProvider>
  );
}
