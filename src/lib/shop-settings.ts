import { z } from "zod";

/* ==================================================================
   Shop settings.

   The details that change without a deploy: who you are, how to reach
   you, when you are open, where your social accounts live. Held in the
   `settings` table under one key, with the values the site shipped with
   as the fallback, so nothing is ever blank.

   Free of any database import so the admin form and the storefront read
   the same definitions.
   ================================================================== */

export const socialLink = z.object({
  name: z.string().trim().min(1, "Name the account"),
  href: z.url("Enter a full address, starting https://"),
});

export const shopSettingsInput = z.object({
  /* --- brand --- */
  name: z.string().trim().min(1, "The shop needs a name"),
  registered: z.string().trim().min(1, "Required"),
  tagline: z.string().trim().max(120).default(""),
  description: z.string().trim().max(600).default(""),

  /* --- contact --- */
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().max(40).default(""),
  /** The same number, digits only, for the `tel:` link. */
  tel: z.string().trim().max(40).default(""),
  address: z.string().trim().max(200).default(""),
  city: z.string().trim().max(80).default(""),
  country: z.string().trim().max(80).default(""),
  hours: z.string().trim().max(120).default(""),

  /* --- social --- */
  social: z.array(socialLink).max(8).default([]),
});

export type ShopSettings = z.infer<typeof shopSettingsInput>;

/** What the site used before any of this was editable. */
export const SHOP_SETTINGS_DEFAULTS: ShopSettings = {
  name: "AUTOTRIZ",
  registered: "AUTOTRIZ®",
  tagline: "Innovative Surface Creation",
  description:
    "AUTOTRIZ manufactures professional nano ceramic coatings for automotive paint, glass, wheels and interiors. Patented polysilazane chemistry, tested and certified by TÜV SÜD and SGS.",

  email: "info@auto-triz.com",
  phone: "",
  tel: "",
  address: "",
  city: "Dhaka",
  country: "Bangladesh",
  hours: "Saturday to Thursday, 10:00 – 19:00",

  social: [
    { name: "Instagram", href: "https://www.instagram.com/autotrizofficial" },
    { name: "Facebook", href: "https://www.facebook.com/autotrizworld" },
    { name: "YouTube", href: "https://www.youtube.com/@autotrizofficial" },
  ],
};

/** Stored values win, but only where they hold something: an emptied
 *  field falls back to the shipped value rather than showing nothing. */
export function mergeShopSettings(stored: unknown): ShopSettings {
  if (typeof stored !== "object" || stored === null) return SHOP_SETTINGS_DEFAULTS;

  const parsed = shopSettingsInput.partial().safeParse(stored);
  if (!parsed.success) return SHOP_SETTINGS_DEFAULTS;

  const out = { ...SHOP_SETTINGS_DEFAULTS };
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    Object.assign(out, { [key]: value });
  }
  return out;
}

export const SHOP_SETTINGS_KEY = "shop";
