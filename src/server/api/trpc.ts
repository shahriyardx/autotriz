import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { can, type Permission } from "@/lib/permissions";

/** Everything a procedure can reach: the database, and who is asking. */
export async function createTRPCContext(opts?: { headers?: Headers }) {
  const session = await auth.api.getSession({
    headers: opts?.headers ?? (await headers()),
  });

  return { db, session, user: session?.user ?? null };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Field-level Zod errors, so a form can show them inline.
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Open to anyone. */
export const publicProcedure = t.procedure;

const STAFF_ROLES = new Set(["owner", "admin", "manager", "staff"]);

/** Requires a signed-in staff account with an admin role. Every admin
 *  mutation goes through this — tRPC endpoints are public HTTP, so being
 *  called from an admin screen proves nothing. */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in first." });
  }
  if (!STAFF_ROLES.has(ctx.user.role ?? "")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account cannot make this change.",
    });
  }
  if (ctx.user.banned) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This account is suspended." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Requires one named permission on top of being staff. Owners always
 *  pass. This is the only gate that matters: the UI hiding a button is
 *  a courtesy, not a control. */
export const permissionProcedure = (permission: Permission) =>
  adminProcedure.use(async ({ ctx, next }) => {
    if (!can(ctx.user, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Your account does not have permission for that.",
      });
    }
    return next({ ctx });
  });
