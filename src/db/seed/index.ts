/**
 * Creates the first owner account, and nothing else.
 *
 *   pnpm db:seed
 *
 * The catalogue is not seeded. Products, categories and media are
 * created in the admin panel and live only in the database — there is
 * no static product file behind the shop.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user as authUser } from "@/db/auth-schema";
import { auth } from "@/lib/auth";

async function seedOwner() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@auto-triz.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "autotriz-admin-2026";

  const [found] = await db
    .select({ id: authUser.id })
    .from(authUser)
    .where(eq(authUser.email, email))
    .limit(1);

  if (found) {
    console.info(`  owner: ${email} (already exists)`);
    await db.update(authUser).set({ role: "owner" }).where(eq(authUser.id, found.id));
    return;
  }

  await auth.api.signUpEmail({ body: { email, password, name: "AUTOTRIZ Admin" } });

  // Sign-up always creates a customer; the first account is the owner.
  await db.update(authUser).set({ role: "owner" }).where(eq(authUser.email, email));

  console.info(`  owner: ${email}`);
  console.info("  Change that password before this is deployed anywhere.");
}

async function run() {
  console.info("Seeding…");
  await seedOwner();
  console.info("Done.");
  process.exit(0);
}

void run();
