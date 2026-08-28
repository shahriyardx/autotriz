import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/customer-guard";
import { SignInForm } from "@/components/account/auth-forms";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage() {
  if (await currentCustomer()) redirect("/account");
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
