import { PageHero } from "@/components/page-hero";
import { AccountNav } from "@/components/account/account-nav";
import { currentCustomer } from "@/lib/customer-guard";

/** The customer's own area. Signed-out visitors still see this shell —
 *  the sign-in and register screens live inside it. */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await currentCustomer();

  return (
    <>
      <PageHero title="My" accent="account" />
      <div className="shell py-14 md:py-20">
        {account ? (
          <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <AccountNav name={account.name} email={account.email} />
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">{children}</div>
        )}
      </div>
    </>
  );
}
