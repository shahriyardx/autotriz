CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "display_type" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_status" text DEFAULT 'taxable' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_class" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gtin" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "backorders" text DEFAULT 'no' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_status" text DEFAULT 'instock' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sold_individually" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_class" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "upsell_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cross_sell_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "attributes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "purchase_note" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviews_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "catalog_visibility" text DEFAULT 'visible' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_categories_category_idx" ON "product_categories" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
-- A struck-through compare-at price was really "regular price, currently on sale".
UPDATE "products" SET "sale_price" = "price", "price" = "compare_at_price" WHERE "compare_at_price" IS NOT NULL AND "compare_at_price" > "price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "compare_at_price";--> statement-breakpoint
-- Every product's primary category is mirrored into the join table.
INSERT INTO "product_categories" ("product_id", "category_id") SELECT "id", "category_id" FROM "products" ON CONFLICT DO NOTHING;