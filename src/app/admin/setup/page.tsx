import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { needsSetup } from "@/lib/setup";
import { SetupForm } from "@/components/admin/setup-form";

export const metadata: Metadata = { title: "Set up the shop", robots: { index: false } };

/** The first screen a fresh installation shows: create the owner. Once
 *  one exists this redirects to the sign-in form for good. */
export default async function AdminSetupPage() {
  if (!(await needsSetup())) redirect("/admin/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md">
        <Image
          src="/brand/autotriz-wordmark.png"
          alt="AUTOTRIZ"
          width={3339}
          height={729}
          priority
          className="mx-auto h-10 w-auto"
        />
        <p className="label mt-6 text-center text-foreground/40">First-time setup</p>

        <div className="mt-8 rounded-lg border bg-card p-8 text-card-foreground shadow-xl">
          <h1 className="text-lg font-semibold">Create the owner account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account has full access to the shop, and is the only one
            that can invite other staff. You will not see this screen again.
          </p>

          <div className="mt-7">
            <SetupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
