import { requireCustomer } from "@/lib/customer-guard";
import { AccountDetailsForm } from "@/components/account/account-details-form";

export const metadata = { title: "My details", robots: { index: false } };

export default async function AccountDetailsPage() {
  await requireCustomer("/account/details");
  return (
    <div className="space-y-8">
      <h1 className="display text-2xl">My details</h1>
      <AccountDetailsForm />
    </div>
  );
}
