import Link from "next/link";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const metadata = { title: "No access", robots: { index: false } };

export default function DeniedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-5 text-center">
      <h1 className="display text-3xl text-foreground">No access</h1>
      <p className="max-w-sm text-foreground/60">
        Your account is signed in but does not have permission to use the admin
        panel. Ask an administrator to raise your role.
      </p>
      <div className="flex gap-4">
        <SignOutButton />
        <Link href="/" className="label text-foreground/60 underline underline-offset-4">
          Back to the site
        </Link>
      </div>
    </div>
  );
}
