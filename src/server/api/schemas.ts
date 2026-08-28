import { z } from "zod";

/** Shared between the tRPC routers and the react-hook-form resolvers, so
 *  the browser and the server validate against exactly the same rules. */

const slug = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lower-case words separated by hyphens");

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalMoney = z
  .union([z.coerce.number().min(0, "Cannot be negative"), z.null()])
  .default(null);

const optionalDecimal = z
  .union([z.coerce.number().min(0, "Cannot be negative"), z.null()])
  .default(null);

const optionalDate = z.coerce.date().nullable().default(null);

export const productAttributeInput = z.object({
  name: z.string().trim().min(1, "Attribute needs a name"),
  values: z.array(z.string().trim().min(1)).min(1, "Add at least one value"),
  visible: z.boolean().default(true),
});

export const productInput = z
  .object({
    /* General */
    name: z.string().trim().min(2, "Name is too short"),
    slug,
    categoryId: z.string().uuid("Pick a primary category"),
    categoryIds: z.array(z.string().uuid()).default([]),
    surface: z.string().trim().min(1, "Surface is required"),
    shortDescription: z.string().trim().default(""),
    description: z.string().trim().default(""),
    /** Entered in whole currency units; stored as minor units. */
    price: z.coerce.number().min(0, "Price cannot be negative"),
    salePrice: optionalMoney,
    saleStartsAt: optionalDate,
    saleEndsAt: optionalDate,
    taxStatus: z.enum(["taxable", "shipping", "none"]).default("taxable"),
    taxClass: z.string().trim().min(1).default("standard"),
    size: optionalText.default(null),
    image: optionalText.default(null),
    features: z.array(z.string().trim().min(1)).default([]),
    /* Inventory */
    sku: z.string().trim().min(1, "SKU is required"),
    gtin: optionalText.default(null),
    trackStock: z.boolean().default(true),
    stock: z.coerce.number().int().min(0, "Cannot be negative"),
    lowStockAt: z.coerce.number().int().min(0, "Cannot be negative"),
    backorders: z.enum(["no", "notify", "yes"]).default("no"),
    stockStatus: z.enum(["instock", "outofstock", "onbackorder"]).default("instock"),
    soldIndividually: z.boolean().default(false),
    /* Shipping */
    weight: optionalDecimal,
    length: optionalDecimal,
    width: optionalDecimal,
    height: optionalDecimal,
    shippingClass: optionalText.default(null),
    /* Linked products */
    upsellIds: z.array(z.string().uuid()).default([]),
    crossSellIds: z.array(z.string().uuid()).default([]),
    /* Attributes */
    attributes: z.array(productAttributeInput).default([]),
    /* Organisation */
    tags: z.array(z.string().trim().min(1)).default([]),
    /* Advanced */
    purchaseNote: optionalText.default(null),
    reviewsEnabled: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
    /* Publishing */
    active: z.boolean().default(true),
    catalogVisibility: z.enum(["visible", "catalog", "search", "hidden"]).default("visible"),
    featured: z.boolean().default(false),
  })
  .refine((p) => p.salePrice === null || p.salePrice < p.price, {
    path: ["salePrice"],
    message: "Sale price must be lower than the regular price",
  })
  .refine(
    (p) => !p.saleStartsAt || !p.saleEndsAt || p.saleStartsAt <= p.saleEndsAt,
    { path: ["saleEndsAt"], message: "Sale must end after it starts" },
  );

export type ProductInput = z.input<typeof productInput>;

export const categoryInput = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  slug,
  parentId: z.string().uuid().nullable().default(null),
  href: z.string().trim().startsWith("/", "Must start with /"),
  blurb: optionalText.default(null),
  image: optionalText.default(null),
  displayType: z.enum(["default", "products", "subcategories", "both"]).default("default"),
  showInMenu: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  active: z.boolean().default(true),
});

export type CategoryInput = z.input<typeof categoryInput>;

export const orderStatusInput = z.enum([
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
]);
