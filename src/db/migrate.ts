/**
 * Applies every pending migration in ./drizzle, in order.
 *
 *   pnpm db:migrate
 *
 * Drizzle records what it has already run in a `__drizzle_migrations`
 * table, so this is safe to run repeatedly and safe to run on deploy.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

// A dedicated single connection: migrations must not share the app pool.
const sql = postgres(connectionString, { max: 1 });

async function run() {
  try {
    console.info("Applying migrations…");
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    console.info("Migrations up to date.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

void run();
