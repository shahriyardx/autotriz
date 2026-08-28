import { createHash, randomBytes, randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { staffInvites, user } from "@/db/auth-schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import { MAIL_CONFIGURED, inviteEmail, sendMail } from "@/lib/mailer";
import {
  ALL_PERMISSIONS,
  ROLES,
  ROLE_PRESETS,
  expandPermissions,
  type Permission,
  type Role,
} from "@/lib/permissions";

/* ==================================================================
   Staff and invitations.

   An invite carries the role and permissions decided by whoever sent
   it. The token is random and only its hash is stored, so a leaked
   database row cannot be redeemed.
   ================================================================== */

const INVITE_DAYS = 7;

const roleEnum = z.enum(ROLES.map((r) => r.key) as [Role, ...Role[]]);
const permissionList = z.array(z.enum(ALL_PERMISSIONS as [Permission, ...Permission[]])).default([]);

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const inviteUrl = (token: string) => {
  const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/admin/invite/${token}`;
};

/** Owners are untouchable by anyone but themselves. */
function guardTarget(target: { id: string; role: string | null }, actorId: string) {
  if (target.role === "owner" && target.id !== actorId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "An owner's account can only be changed by that owner.",
    });
  }
}

export const staffRouter = createTRPCRouter({
  list: permissionProcedure("staff.view").query(async ({ ctx }) => {
    const [members, invites] = await Promise.all([
      ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          permissions: user.permissions,
          banned: user.banned,
          createdAt: user.createdAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt)),
      ctx.db
        .select({
          id: staffInvites.id,
          email: staffInvites.email,
          role: staffInvites.role,
          permissions: staffInvites.permissions,
          invitedByName: staffInvites.invitedByName,
          expiresAt: staffInvites.expiresAt,
          createdAt: staffInvites.createdAt,
        })
        .from(staffInvites)
        .where(and(isNull(staffInvites.acceptedAt), isNull(staffInvites.revokedAt)))
        .orderBy(desc(staffInvites.createdAt)),
    ]);

    return { members, invites, mailConfigured: MAIL_CONFIGURED };
  }),

  invite: permissionProcedure("staff.manage")
    .input(
      z.object({
        email: z.email("Enter a valid email address"),
        role: roleEnum.default("staff"),
        permissions: permissionList,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();

      if (input.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A second owner cannot be invited. Invite an administrator instead.",
        });
      }

      const [existing] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(sql`lower(${user.email}) = ${email}`)
        .limit(1);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Someone with that email already has an account.",
        });
      }

      // Re-inviting the same address replaces the pending invite.
      await ctx.db
        .update(staffInvites)
        .set({ revokedAt: new Date() })
        .where(
          and(
            sql`lower(${staffInvites.email}) = ${email}`,
            isNull(staffInvites.acceptedAt),
            isNull(staffInvites.revokedAt),
          ),
        );

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

      const [row] = await ctx.db
        .insert(staffInvites)
        .values({
          id: randomUUID(),
          email,
          role: input.role,
          permissions: expandPermissions(
            input.permissions.length ? input.permissions : ROLE_PRESETS[input.role],
          ),
          tokenHash: hashToken(token),
          invitedBy: ctx.user.id,
          invitedByName: ctx.user.name,
          expiresAt,
        })
        .returning({ id: staffInvites.id });

      const url = inviteUrl(token);
      const roleLabel = ROLES.find((r) => r.key === input.role)?.label ?? input.role;
      let sent = false;
      try {
        const body = inviteEmail({
          url,
          invitedBy: ctx.user.name,
          roleLabel,
          expiresInDays: INVITE_DAYS,
        });
        const result = await sendMail({
          to: email,
          subject: `You have been invited to the AUTOTRIZ admin panel`,
          ...body,
        });
        sent = result.sent;
      } catch {
        // The invite still stands; the link can be passed on by hand.
        sent = false;
      }

      revalidatePath("/admin/staff");
      return { id: row.id, url, sent, email };
    }),

  /** Issues a fresh token for a pending invite and re-sends it. */
  resendInvite: permissionProcedure("staff.manage")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [invite] = await ctx.db
        .select()
        .from(staffInvites)
        .where(eq(staffInvites.id, input.id))
        .limit(1);

      if (!invite || invite.acceptedAt || invite.revokedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "That invitation is no longer pending." });
      }

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
      await ctx.db
        .update(staffInvites)
        .set({ tokenHash: hashToken(token), expiresAt })
        .where(eq(staffInvites.id, input.id));

      const url = inviteUrl(token);
      let sent = false;
      try {
        const roleLabel = ROLES.find((r) => r.key === invite.role)?.label ?? invite.role;
        const body = inviteEmail({
          url,
          invitedBy: ctx.user.name,
          roleLabel,
          expiresInDays: INVITE_DAYS,
        });
        const result = await sendMail({
          to: invite.email,
          subject: `Your invitation to the AUTOTRIZ admin panel`,
          ...body,
        });
        sent = result.sent;
      } catch {
        sent = false;
      }

      revalidatePath("/admin/staff");
      return { url, sent, email: invite.email };
    }),

  revokeInvite: permissionProcedure("staff.manage")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(staffInvites)
        .set({ revokedAt: new Date() })
        .where(eq(staffInvites.id, input.id));
      revalidatePath("/admin/staff");
      return { ok: true };
    }),

  /** Changes what an existing account may do. */
  updateAccess: permissionProcedure("staff.manage")
    .input(
      z.object({
        id: z.string().min(1),
        role: roleEnum,
        permissions: permissionList,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      guardTarget(target, ctx.user.id);

      if (input.role === "owner" && target.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "There is one owner. Transfer ownership from the owner's own account.",
        });
      }

      await ctx.db
        .update(user)
        .set({
          role: target.role === "owner" ? "owner" : input.role,
          permissions: expandPermissions(input.permissions),
          updatedAt: new Date(),
        })
        .where(eq(user.id, input.id));

      revalidatePath("/admin/staff");
      return { ok: true };
    }),

  /** Suspends an account without deleting its history. */
  setSuspended: permissionProcedure("staff.manage")
    .input(z.object({ id: z.string().min(1), suspended: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot suspend your own account." });
      }
      const [target] = await ctx.db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      guardTarget(target, ctx.user.id);

      await ctx.db
        .update(user)
        .set({ banned: input.suspended, updatedAt: new Date() })
        .where(eq(user.id, input.id));

      revalidatePath("/admin/staff");
      return { ok: true };
    }),

  remove: permissionProcedure("staff.manage")
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own account." });
      }
      const [target] = await ctx.db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      guardTarget(target, ctx.user.id);

      await ctx.db.delete(user).where(eq(user.id, input.id));
      revalidatePath("/admin/staff");
      return { ok: true };
    }),
});
