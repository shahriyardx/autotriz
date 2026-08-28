import { NextResponse } from "next/server";
import { db } from "@/db";
import { enquiries } from "@/db/schema";

/** Enquiry intake.
 *
 *  For now this validates the payload and logs it. Wiring it to a CRM or
 *  a transactional mail provider is a later phase — the contract the
 *  form depends on will not change when that happens.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const required = ["firstName", "lastName", "email", "country", "message"];
  const missing = required.filter(
    (field) => typeof body[field] !== "string" || !String(body[field]).trim(),
  );

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 422 },
    );
  }

  const email = String(body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 422 },
    );
  }

  const text = (key: string) => {
    const value = body[key];
    return typeof value === "string" && value.trim() && value.trim() !== "—"
      ? value.trim()
      : null;
  };

  await db.insert(enquiries).values({
    topic: typeof body.topic === "string" ? body.topic : "general",
    firstName: text("firstName"),
    lastName: text("lastName"),
    email,
    phone: text("phone"),
    company: text("company"),
    country: text("country"),
    message: text("message"),
  });

  return NextResponse.json({ ok: true });
}
