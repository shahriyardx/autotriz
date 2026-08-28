import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customerAddresses } from "@/db/schema";
import { user as userTable } from "@/db/auth-schema";
import { currentCustomer } from "@/lib/customer-guard";
import { PageHero } from "@/components/page-hero";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const account = await currentCustomer();

  // A signed-in customer starts with their own details already filled.
  let phone = "";
  let address = null;

  if (account) {
    const [row] = await db
      .select({ phone: userTable.phone })
      .from(userTable)
      .where(eq(userTable.id, account.id))
      .limit(1);
    phone = row?.phone ?? "";

    const [saved] = await db
      .select({ address: customerAddresses.address })
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, account.id))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt))
      .limit(1);
    address = saved?.address ?? null;
  }

  return (
    <>
      <PageHero title="Secure" accent="checkout" />
      <div className="shell py-16 md:py-20">
        <CheckoutForm
          signedIn={Boolean(account)}
          cardEnabled={Boolean(process.env.STRIPE_SECRET_KEY)}
          defaults={{
            email: account?.email ?? "",
            name: account?.name ?? "",
            phone,
            address,
          }}
        />
      </div>
    </>
  );
}
