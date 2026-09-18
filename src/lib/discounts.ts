import { z } from "zod";

/* ==================================================================
   Discount codes.

   The rules live here rather than in the router, because the checkout
   needs to show what a code is worth before the order exists and the
   server needs to decide the same thing again when it is placed. Two
   copies of "is this code any good" would eventually disagree, and
   the one that matters is the one the customer is not looking at.

   No database import, so the browser can use the same rules.
   ================================================================== */

export const discountTypes = ["percent", "fixed"] as const;
export type DiscountType = (typeof discountTypes)[number];

/** What the admin form sends. Money arrives in taka and is stored in
 *  minor units, as everything else is. */
export const discountInput = z.object({
  code: z
    .string()
    .trim()
    .min(3, "At least three characters")
    .max(32, "Keep it under thirty-two characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, hyphens and underscores only"),
  type: z.enum(discountTypes).default("percent"),
  /** A percentage when the type is percent, taka when it is fixed. */
  value: z.number().positive("Enter an amount"),
  /** Taka. The order has to reach this before the code applies. */
  minSubtotal: z.number().min(0).default(0),
  /** How many times it may be used in total. Empty means no limit. */
  usageLimit: z.number().int().positive().nullable().default(null),
  startsAt: z.string().nullable().default(null),
  endsAt: z.string().nullable().default(null),
  active: z.boolean().default(true),
});

export type DiscountInput = z.input<typeof discountInput>;

/** A code as the rules need to see it. Matches the database row. */
export type DiscountRule = {
  code: string;
  type: DiscountType;
  /** Percentage, or minor units for a fixed amount. */
  value: number;
  /** Minor units. */
  minSubtotal: number;
  usageLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

export type DiscountVerdict =
  | { ok: true; code: string; amount: number; label: string }
  | { ok: false; reason: string };

/**
 * Decides what a code takes off a subtotal, or why it does not apply.
 *
 * `now` is passed in rather than read, so a test can ask about a
 * Tuesday without waiting for one.
 */
export function evaluateDiscount(
  rule: DiscountRule | null | undefined,
  subtotal: number,
  now: Date = new Date(),
): DiscountVerdict {
  if (!rule) return { ok: false, reason: "That code was not recognised." };
  if (!rule.active) return { ok: false, reason: "That code is no longer active." };

  if (rule.startsAt && now < rule.startsAt) {
    return { ok: false, reason: "That code is not active yet." };
  }
  if (rule.endsAt && now > rule.endsAt) {
    return { ok: false, reason: "That code has expired." };
  }
  if (rule.usageLimit !== null && rule.usedCount >= rule.usageLimit) {
    return { ok: false, reason: "That code has been fully redeemed." };
  }
  if (subtotal < rule.minSubtotal) {
    return {
      ok: false,
      reason: `That code needs an order of at least ${(rule.minSubtotal / 100).toFixed(2)}.`,
    };
  }

  const raw =
    rule.type === "percent"
      ? Math.round((subtotal * rule.value) / 100)
      : Math.round(rule.value);

  // Never more than the goods are worth: shipping is not discountable.
  const amount = Math.max(0, Math.min(raw, subtotal));

  if (amount <= 0) return { ok: false, reason: "That code takes nothing off this order." };

  return {
    ok: true,
    code: rule.code,
    amount,
    label: rule.type === "percent" ? `${rule.value}% off` : "Amount off",
  };
}

/** Codes are stored and compared in upper case, so nobody loses an
 *  order to the shift key. */
export const normaliseCode = (code: string) => code.trim().toUpperCase();
