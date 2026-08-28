import { requirePermission } from "@/lib/admin-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit/card";
import { currency, FREE_SHIPPING_THRESHOLD } from "@/lib/shop-config";
import { formatPrice } from "@/lib/shop-config";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requirePermission("settings.edit");

  const rows = [
    { k: "Currency", v: currency.code },
    { k: "Free shipping over", v: formatPrice(FREE_SHIPPING_THRESHOLD) },
    {
      k: "Payments",
      v: process.env.STRIPE_SECRET_KEY ? "Stripe key present" : "No Stripe key set",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shop configuration as it stands right now.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {rows.map((row) => (
              <div key={row.k} className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-muted-foreground">{row.k}</dt>
                <dd className="text-right font-medium">{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            These are read from <code>src/lib/shop-config.ts</code> and the
            environment. Editing them from this screen is on the list — the
            settings table is already in the database for it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
