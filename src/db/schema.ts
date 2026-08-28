import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ==================================================================
   CATALOGUE
   Money is stored as an integer number of minor units (cents), never
   as a float. `numeric` is used only where a rate needs decimals.
   ================================================================== */

/** What a category archive page shows first, as in WooCommerce. */
export const categoryDisplayTypes = ["default", "products", "subcategories", "both"] as const;
export type CategoryDisplayType = (typeof categoryDisplayTypes)[number];

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** Optional parent, which makes this a sub-category. */
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    /** Description shown on the range cards and the archive page. */
    blurb: text("blurb"),
    /** The storefront path this category lives at. */
    href: text("href").notNull(),
    image: text("image"),
    displayType: text("display_type")
      .$type<CategoryDisplayType>()
      .notNull()
      .default("default"),
    /** Shown in the shop menu in the header and footer. When nothing is
     *  ticked the first four active top-level categories stand in. */
    showInMenu: boolean("show_in_menu").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_idx").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ],
);

export const taxStatuses = ["taxable", "shipping", "none"] as const;
export type TaxStatus = (typeof taxStatuses)[number];

export const backorderPolicies = ["no", "notify", "yes"] as const;
export type BackorderPolicy = (typeof backorderPolicies)[number];

export const stockStatuses = ["instock", "outofstock", "onbackorder"] as const;
export type StockStatus = (typeof stockStatuses)[number];

export const catalogVisibilities = ["visible", "catalog", "search", "hidden"] as const;
export type CatalogVisibility = (typeof catalogVisibilities)[number];

/** A WooCommerce-style custom attribute, e.g. Finish → Gloss / Matte. */
export type ProductAttribute = {
  name: string;
  values: string[];
  visible: boolean;
};

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    surface: text("surface").notNull(),
    description: text("description").notNull().default(""),
    shortDescription: text("short_description").notNull().default(""),
    /** Regular price in minor units, e.g. 14900 = $149.00 */
    price: integer("price").notNull().default(0),
    /** Sale price, same units. Applies between the two dates below, or
     *  always when both are null. */
    salePrice: integer("sale_price"),
    saleStartsAt: timestamp("sale_starts_at", { withTimezone: true }),
    saleEndsAt: timestamp("sale_ends_at", { withTimezone: true }),
    taxStatus: text("tax_status").$type<TaxStatus>().notNull().default("taxable"),
    taxClass: text("tax_class").notNull().default("standard"),
    size: text("size"),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    image: text("image"),
    /** GTIN, UPC, EAN or ISBN. */
    gtin: text("gtin"),
    stock: integer("stock").notNull().default(0),
    /** Below this, the admin dashboard flags the product. */
    lowStockAt: integer("low_stock_at").notNull().default(5),
    trackStock: boolean("track_stock").notNull().default(true),
    backorders: text("backorders").$type<BackorderPolicy>().notNull().default("no"),
    /** Only consulted when `trackStock` is off. */
    stockStatus: text("stock_status").$type<StockStatus>().notNull().default("instock"),
    soldIndividually: boolean("sold_individually").notNull().default(false),
    /** Shipping dimensions: kilograms and centimetres. */
    weight: numeric("weight", { precision: 10, scale: 3, mode: "number" }),
    length: numeric("length", { precision: 10, scale: 2, mode: "number" }),
    width: numeric("width", { precision: 10, scale: 2, mode: "number" }),
    height: numeric("height", { precision: 10, scale: 2, mode: "number" }),
    shippingClass: text("shipping_class"),
    upsellIds: jsonb("upsell_ids").$type<string[]>().notNull().default([]),
    crossSellIds: jsonb("cross_sell_ids").$type<string[]>().notNull().default([]),
    attributes: jsonb("attributes").$type<ProductAttribute[]>().notNull().default([]),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    purchaseNote: text("purchase_note"),
    reviewsEnabled: boolean("reviews_enabled").notNull().default(true),
    active: boolean("active").notNull().default(true),
    catalogVisibility: text("catalog_visibility")
      .$type<CatalogVisibility>()
      .notNull()
      .default("visible"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_category_idx").on(t.categoryId),
  ],
);

/** Extra categories beyond the primary `products.category_id`, so a
 *  product can sit in several places like it does in WooCommerce. The
 *  primary category is always mirrored in here too. */
export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.categoryId] }),
    index("product_categories_category_idx").on(t.categoryId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/* ==================================================================
   MEDIA LIBRARY
   Every file uploaded through the admin, whether or not it is attached
   to something. The object itself lives in R2; this is the index.
   ================================================================== */

/** Named folders for the library. `media.folder` holds the slug. */
export const mediaFolders = pgTable(
  "media_folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("media_folders_slug_idx").on(t.slug)],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Object key in the bucket. Changes when the file is renamed. */
    key: text("key").notNull(),
    url: text("url").notNull(),
    /** The name shown in the library, without the extension. */
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt"),
    title: text("title"),
    /** "products", "categories", "content" — where it was uploaded from. */
    folder: text("folder").notNull().default("products"),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("media_key_idx").on(t.key),
    index("media_created_idx").on(t.createdAt),
    index("media_folder_idx").on(t.folder),
  ],
);

/* ==================================================================
   ORDERS
   ================================================================== */

export const orderStatuses = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-facing reference, e.g. AT-1042. */
    number: text("number").notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    /** Set when the order was placed by a signed-in customer. */
    userId: text("user_id"),
    email: text("email").notNull(),
    customerName: text("customer_name"),
    phone: text("phone"),
    currency: text("currency").notNull().default("BDT"),
    subtotal: integer("subtotal").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull().default(0),
    discountCode: text("discount_code"),
    shippingAddress: jsonb("shipping_address").$type<Address | null>(),
    billingAddress: jsonb("billing_address").$type<Address | null>(),
    paymentMethod: text("payment_method").$type<PaymentMethod>().notNull().default("cod"),
    paymentStatus: text("payment_status").$type<PaymentStatus>().notNull().default("unpaid"),
    shippingMethod: text("shipping_method"),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    notes: text("notes"),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    index("orders_email_idx").on(t.email),
    index("orders_status_idx").on(t.status),
    index("orders_user_idx").on(t.userId),
  ],
);

export type Address = {
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  /** Upazila or thana. */
  city: string;
  /** District. */
  region?: string;
  postcode?: string;
  country: string;
};

export const paymentMethods = ["cod", "bank", "card"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentStatuses = ["unpaid", "paid", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

/** Addresses a signed-in customer has saved for next time. */
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    label: text("label"),
    address: jsonb("address").$type<Address>().notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("customer_addresses_user_idx").on(t.userId)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** Kept nullable so deleting a product never destroys order history. */
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    /** Name, SKU and price are copied in, not joined, so an order always
     *  shows what was actually bought at the price it was bought for. */
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/* ==================================================================
   DISCOUNTS
   ================================================================== */

export const discounts = pgTable(
  "discounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    /** "percent" applies `value` as a percentage, "fixed" as minor units. */
    type: text("type").$type<"percent" | "fixed">().notNull().default("percent"),
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    minSubtotal: integer("min_subtotal").notNull().default(0),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("discounts_code_idx").on(t.code)],
);

/* ==================================================================
   ENQUIRIES  (contact form + newsletter, so the admin sees both)
   ================================================================== */

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topic: text("topic").notNull().default("general"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email").notNull(),
    phone: text("phone"),
    company: text("company"),
    country: text("country"),
    message: text("message"),
    handled: boolean("handled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("enquiries_topic_idx").on(t.topic)],
);

/* ==================================================================
   PAGE CONTENT
   Editable copy and images for the fixed storefront pages. The layout
   stays in the code; only the words come from here.
   ================================================================== */

export const pageContent = pgTable("page_content", {
  /** Matches a key in `src/lib/page-content.ts`, e.g. "home". */
  page: text("page").primaryKey(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ==================================================================
   SETTINGS  (single-row-per-key store for shop configuration)
   ================================================================== */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ==================================================================
   RELATIONS
   ================================================================== */

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryTree",
  }),
  children: many(categories, { relationName: "categoryTree" }),
  products: many(products),
  productLinks: many(productCategories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  categoryLinks: many(productCategories),
  images: many(productImages),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, {
    fields: [productCategories.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
