import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

/** One account system for the whole shop.
 *
 *  Public sign-up creates a `customer`. Staff accounts are never made
 *  this way — they come from an invitation, which sets the role and the
 *  permissions itself, so signing up can never grant admin access.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    // No public sign-up route, so nothing to verify by email yet.
    requireEmailVerification: false,
    minPasswordLength: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      /** Fine-grained access, on top of the role. */
      permissions: { type: "string[]", defaultValue: [], input: false },
      /** Never accepted from the request — see the hook below. */
      role: { type: "string", defaultValue: "customer", input: false },
      phone: { type: "string", required: false, defaultValue: "" },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (created) => ({
          // Whatever the request said, a new account is a customer.
          data: { ...created, role: "customer", permissions: [] },
        }),
      },
    },
  },
  plugins: [
    // Adds `role`, plus ban / impersonate / list-users endpoints.
    admin(),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
