import { requirePermission } from "@/lib/admin-guard";
import { trpc } from "@/trpc/server";
import { currency, FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/shop-config";
import { ShopSettingsForm } from "@/components/admin/shop-settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit/card";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requirePermission("settings.edit");
  const { settings } = await trpc.settings.get();

  const fixed = [
    { k: "Currency", v: currency.code },
    { k: "Free delivery over", v: formatPrice(FREE_SHIPPING_THRESHOLD) },
    {
      k: "Card payments",
      v: process.env.STRIPE_SECRET_KEY ? "Stripe key present" : "No Stripe key set",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your contact details, opening hours and social accounts, as they
          appear in the header, the footer and on the contact page.
        </p>
      </div>

      <ShopSettingsForm initial={settings} />

      <Card>
        <CardHeader>
          <CardTitle>Set outside the panel</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {fixed.map((row) => (
              <div key={row.k} className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-muted-foreground">{row.k}</dt>
                <dd className="text-right font-medium">{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            Currency and delivery come from <code>src/lib/shop-config.ts</code>;
            payment keys come from the environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
