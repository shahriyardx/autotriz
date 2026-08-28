import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/auth-schema";

/* Is there an owner yet?
 *
 * A shop with no owner has never been set up, so /admin sends the first
 * visitor to the setup screen instead of the sign-in form — the way
 * WordPress does on a fresh install. */
export async function needsSetup(): Promise<boolean> {
  const [row] = await db
    .select({ owners: sql<number>`count(*)::int` })
    .from(user)
    .where(sql`${user.role} = 'owner'`);

  return (row?.owners ?? 0) === 0;
}
