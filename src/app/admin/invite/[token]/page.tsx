import Image from "next/image";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { staffInvites } from "@/db/auth-schema";
import { hashToken } from "@/server/api/routers/staff";
import { ROLES } from "@/lib/permissions";
import { AcceptInviteForm } from "@/components/admin/accept-invite-form";

export const metadata = { title: "Accept invitation", robots: { index: false } };

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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

  const valid = Boolean(invite) && invite.expiresAt > new Date();
  const roleLabel = ROLES.find((r) => r.key === invite?.role)?.label ?? invite?.role;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="w-full max-w-md">
        <Image
          src="/brand/autotriz-wordmark.png"
          alt="AUTOTRIZ"
          width={3339}
          height={729}
          priority
          className="mx-auto h-10 w-auto"
        />

        {valid ? (
          <>
            <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {invite.invitedByName
                ? `${invite.invitedByName} invited you`
                : "You have been invited"}
            </p>
            <div className="mt-8 rounded-lg border bg-card p-8 text-card-foreground shadow-xl">
              <p className="text-sm text-muted-foreground">
                Joining as <span className="font-medium text-foreground">{roleLabel}</span>
              </p>
              <p className="mt-1 break-all text-sm font-medium">{invite.email}</p>
              <div className="mt-6">
                <AcceptInviteForm token={token} />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-lg border bg-card p-8 text-center text-card-foreground shadow-xl">
            <p className="font-medium">This invitation is no longer valid</p>
            <p className="mt-3 text-sm text-muted-foreground">
              It may have expired, been withdrawn, or already been used. Ask
              whoever invited you to send a new one.
            </p>
            <Link href="/admin/login" className="mt-6 inline-block text-sm underline underline-offset-4">
              Go to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
