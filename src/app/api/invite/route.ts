import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { staffInvites, user } from "@/db/auth-schema";
import { auth } from "@/lib/auth";
import { hashToken } from "@/server/api/routers/staff";

/**
 * Redeems a staff invitation.
 *
 * Deliberately not a tRPC procedure: the person accepting has no session
 * yet, and this is the one place an account may be created without one.
 */

const body = z.object({
  token: z.string().min(10),
  name: z.string().trim().min(2, "Enter your name"),
  password: z.string().min(10, "Use at least 10 characters"),
});

export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  const { token, name, password } = parsed.data;

  const [invite] = await db
    .select()
    .from(staffInvites)
    .where(
      and(
        eq(staffInvites.tokenHash, hashToken(token)),
        isNull(staffInvites.acceptedAt),
        isNull(staffInvites.revokedAt),
      ),
    )
    .limit(1);

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "That invitation is no longer valid. Ask for a new one." },
      { status: 410 },
    );
  }

  const [taken] = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${invite.email.toLowerCase()}`)
    .limit(1);
  if (taken) {
    return NextResponse.json(
      { error: "An account with that email already exists. Sign in instead." },
      { status: 409 },
    );
  }

  try {
    // better-auth hashes the password and opens the session.
    const created = await auth.api.signUpEmail({
      body: { email: invite.email, password, name },
      headers: request.headers,
      asResponse: true,
    });

    // The role and permissions come from the invite, never from the form.
    await db
      .update(user)
      .set({ role: invite.role, permissions: invite.permissions, updatedAt: new Date() })
      .where(sql`lower(${user.email}) = ${invite.email.toLowerCase()}`);

    await db
      .update(staffInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(staffInvites.id, invite.id));

    // Pass better-auth's session cookies straight through.
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
