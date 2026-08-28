import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { needsSetup } from "@/lib/setup";

/**
 * Creates the very first owner account.
 *
 * Open by necessity — there is nobody to authorise it yet — but it
 * refuses the moment an owner exists, so it can only ever be used once.
 */

const body = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(10, "Use at least 10 characters"),
});

export async function POST(request: Request) {
  if (!(await needsSetup())) {
    return NextResponse.json(
      { error: "This shop already has an owner. Sign in instead." },
      { status: 409 },
    );
  }

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const lowered = email.trim().toLowerCase();

  const [taken] = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${lowered}`)
    .limit(1);

  if (taken) {
    return NextResponse.json(
      {
        error:
          "An account already uses that email. Sign in with it, or set the shop up with a different address.",
      },
      { status: 409 },
    );
  }

  try {
    const created = await auth.api.signUpEmail({
      body: { email: lowered, password, name },
      headers: request.headers,
      asResponse: true,
    });

    // Sign-up always makes a customer; this one becomes the owner. The
    // condition is repeated here so two simultaneous requests cannot
    // both end up owning the shop.
    const promoted = await db
      .update(user)
      .set({ role: "owner", updatedAt: new Date() })
      .where(
        sql`lower(${user.email}) = ${lowered} and not exists (select 1 from "user" u where u.role = 'owner')`,
      )
      .returning({ id: user.id });

    if (!promoted.length) {
      return NextResponse.json(
        { error: "This shop already has an owner. Sign in instead." },
        { status: 409 },
      );
    }

    const response = NextResponse.json({ ok: true });
    for (const cookie of created.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not create the account. Try again." },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ needsSetup: await needsSetup() });
}

export const dynamic = "force-dynamic";
