import { requireCustomer } from "@/lib/customer-guard";
import { AddressBook } from "@/components/account/address-book";

export const metadata = { title: "Addresses", robots: { index: false } };

export default async function AccountAddressesPage() {
  await requireCustomer("/account/addresses");
  return (
    <div className="space-y-8">
      <h1 className="display text-2xl">Addresses</h1>
      <AddressBook />
    </div>
  );
}
