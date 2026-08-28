import { NextResponse } from "next/server";

/**
 * Liveness for the container health check and for Coolify.
 *
 * The database client is imported inside the handler on purpose: it
 * throws when `DATABASE_URL` is missing, and this route must not drag
 * that into the build, where there is no database.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { sql } = await import("@/db");
    await sql`select 1`;
    return NextResponse.json({ ok: true, database: "up" });
  } catch {
    return NextResponse.json({ ok: false, database: "down" }, { status: 503 });
  }
}
