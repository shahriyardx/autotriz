import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { currentUser } from "@/lib/admin-guard";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await currentUser()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-sm">
        <Image
          src="/brand/autotriz-wordmark.png"
          alt="AUTOTRIZ"
          width={3339}
          height={729}
          priority
          className="mx-auto h-10 w-auto"
        />
        <p className="label mt-6 text-center text-foreground/40">Staff sign in</p>

        <div className="mt-8 rounded-lg border bg-card p-8 text-card-foreground shadow-xl">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-foreground/30">
          Accounts are issued by an administrator. There is no public sign-up.
        </p>
      </div>
    </div>
  );
}
