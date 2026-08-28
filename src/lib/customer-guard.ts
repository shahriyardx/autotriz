import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/* Shop customers. Staff roles are handled by `admin-guard`; a customer
   account can never reach the admin panel, and vice versa. */

export async function currentCustomer() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireCustomer(next?: string) {
  const user = await currentCustomer();
  if (!user) {
    redirect(next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login");
  }
  return user;
}
