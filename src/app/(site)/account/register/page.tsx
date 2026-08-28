import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/customer-guard";
import { RegisterForm } from "@/components/account/auth-forms";

export const metadata = { title: "Create an account", robots: { index: false } };

export default async function RegisterPage() {
  if (await currentCustomer()) redirect("/account");
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
