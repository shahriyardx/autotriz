import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import { can, type Permission } from "@/lib/permissions";

const STAFF_ROLES = new Set(["owner", "admin", "manager", "staff"]);

/** Returns the signed-in staff member, or sends the visitor to the login
 *  screen. Every admin page and every admin action calls this — there is
 *  no middleware doing it invisibly. */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/admin/login");
  if (!STAFF_ROLES.has(session.user.role ?? "")) redirect("/admin/denied");
  if (session.user.banned) redirect("/admin/denied");

  return session.user;
}

/** Same as `requireAdmin`, but the page also needs one named permission. */
export async function requirePermission(permission: Permission) {
  const user = await requireAdmin();
  if (!can(user, permission)) redirect("/admin/denied");
  return user;
}

export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
