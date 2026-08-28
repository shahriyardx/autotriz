import { z } from "zod";

/* Shared between the checkout form and the server that trusts none of
   it. Free of database imports so the browser can use the same rules. */

export const addressInput = z.object({
  name: z.string().trim().min(2, "Enter the full name"),
  phone: z.string().trim().min(6, "Enter a phone number").optional().or(z.literal("")),
  line1: z.string().trim().min(3, "Enter the street address"),
  line2: z.string().trim().optional().or(z.literal("")),
  /** District. */
  region: z.string().trim().min(2, "Choose a district"),
  /** Upazila or thana — the smallest unit a courier needs. */
  city: z.string().trim().min(2, "Choose an upazila"),
  postcode: z.string().trim().optional().or(z.literal("")),
  country: z.string().trim().min(2, "Enter the country"),
});

export type AddressInput = z.infer<typeof addressInput>;

export const checkoutInput = z
  .object({
    lines: z
      .array(
        z.object({
          slug: z.string().trim().min(1),
          quantity: z.coerce.number().int().min(1).max(99),
        }),
      )
      .min(1, "Your cart is empty"),
    email: z.email("Enter a valid email address"),
    phone: z.string().trim().min(6, "Enter a phone number"),
    shipping: addressInput,
    /** When false the billing address is used as entered. */
    billingSameAsShipping: z.boolean().default(true),
    billing: addressInput.optional(),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    paymentMethod: z.enum(["cod", "bank", "card"]).default("cod"),
    /** Guests may open an account as they check out. */
    createAccount: z.boolean().default(false),
    password: z.string().optional().or(z.literal("")),
    saveAddress: z.boolean().default(false),
  })
  .refine((v) => v.billingSameAsShipping || v.billing !== undefined, {
    path: ["billing"],
    message: "Enter a billing address, or use the shipping address",
  })
  .refine((v) => !v.createAccount || (v.password ?? "").length >= 10, {
    path: ["password"],
    message: "Use at least 10 characters",
  });

export type CheckoutInput = z.input<typeof checkoutInput>;

/* ------------------------------------------------------------------
   Shipping. One flat rate, free over the threshold — the same sum on
   the server and in the summary the customer reads.
   ------------------------------------------------------------------ */

export const SHIPPING_FLAT_RATE = 12000; // ৳120.00 in minor units

export function shippingFor(subtotal: number, threshold: number) {
  if (subtotal <= 0) return 0;
  return subtotal >= threshold ? 0 : SHIPPING_FLAT_RATE;
}

export const PAYMENT_METHODS = [
  {
    value: "cod",
    label: "Cash on delivery",
    description: "Pay the courier when the parcel arrives.",
  },
  {
    value: "bank",
    label: "Bank transfer",
    description: "We send account details with your confirmation.",
  },
  {
    value: "card",
    label: "Card payment",
    description: "Pay now by card through Stripe.",
  },
] as const;
