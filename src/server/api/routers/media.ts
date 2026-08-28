import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { categories, media, mediaFolders, productImages, products } from "@/db/schema";
import { createTRPCRouter, permissionProcedure } from "@/server/api/trpc";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  R2_CONFIGURED,
  buildKey,
  createUploadUrl,
  deleteObject,
  isStoredInR2,
  keyFromUrl,
  publicUrl,
  renameObject,
} from "@/lib/r2";

const requireR2 = () => {
  if (!R2_CONFIGURED) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Image storage is not configured yet. Add the R2 keys to the environment.",
    });
  }
};

export const mediaRouter = createTRPCRouter({
  /** Lets the admin UI show an honest state instead of failing on click. */
  status: permissionProcedure("media.view").query(() => ({ configured: R2_CONFIGURED })),

  /** Step one: hand the browser a short-lived URL to PUT the file to. */
  createUploadUrl: permissionProcedure("media.edit")
    .input(
      z.object({
        filename: z.string().trim().min(1),
        contentType: z.enum(ALLOWED_IMAGE_TYPES),
        size: z
          .number()
          .int()
          .positive()
          .max(MAX_UPLOAD_BYTES, "That image is larger than 8 MB"),
        prefix: z.string().trim().default("products"),
      }),
    )
    .mutation(async ({ input }) => {
      requireR2();

      const key = buildKey({
        prefix: input.prefix,
        filename: input.filename,
        contentType: input.contentType,
      });

      return createUploadUrl({
        key,
        contentType: input.contentType,
        contentLength: input.size,
      });
    }),

  /** Step two: record the finished upload against a product. */
  attachToProduct: permissionProcedure("media.edit")
    .input(
      z.object({
        productId: z.string().uuid(),
        key: z.string().trim().min(1),
        alt: z.string().trim().nullable().default(null),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireR2();

      const [{ nextOrder }] = await ctx.db
        .select({
          nextOrder: sql<number>`coalesce(max(${productImages.sortOrder}) + 1, 0)::int`,
        })
        .from(productImages)
        .where(eq(productImages.productId, input.productId));

      const url = publicUrl(input.key);

      const [row] = await ctx.db
        .insert(productImages)
        .values({
          productId: input.productId,
          url,
          alt: input.alt,
          sortOrder: nextOrder,
        })
        .returning();

      // The first image uploaded becomes the product's main shot.
      await ctx.db
        .update(products)
        .set({ image: sql`coalesce(${products.image}, ${url})`, updatedAt: new Date() })
        .where(eq(products.id, input.productId));

      revalidatePath("/shop");
      revalidatePath("/admin/products");
      return row;
    }),

  listForProduct: permissionProcedure("media.view")
    .input(z.object({ productId: z.string().uuid() }))
    .query(async ({ ctx, input }) =>
      ctx.db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, input.productId))
        .orderBy(productImages.sortOrder),
    ),

  remove: permissionProcedure("media.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [image] = await ctx.db
        .select()
        .from(productImages)
        .where(eq(productImages.id, input.id))
        .limit(1);

      if (!image) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.delete(productImages).where(eq(productImages.id, input.id));

      // Only reach for R2 if the file actually lives there.
      if (isStoredInR2(image.url)) {
        try {
          await deleteObject(image.url);
        } catch {
          // The row is gone either way; an orphaned object is not worth
          // failing the request over.
        }
      }

      // If that was the main shot, promote whatever is now first.
      const [next] = await ctx.db
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, image.productId))
        .orderBy(productImages.sortOrder)
        .limit(1);

      await ctx.db
        .update(products)
        .set({ image: next?.url ?? null, updatedAt: new Date() })
        .where(and(eq(products.id, image.productId), eq(products.image, image.url)));

      revalidatePath("/shop");
      revalidatePath("/admin/products");
      return { ok: true };
    }),

  /** Drag-and-drop reordering sends the whole list back. */
  reorder: permissionProcedure("media.edit")
    .input(
      z.object({
        productId: z.string().uuid(),
        ids: z.array(z.string().uuid()).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        for (const [index, id] of input.ids.entries()) {
          await tx
            .update(productImages)
            .set({ sortOrder: index })
            .where(
              and(
                eq(productImages.id, id),
                eq(productImages.productId, input.productId),
              ),
            );
        }

        const [first] = await tx
          .select({ url: productImages.url })
          .from(productImages)
          .where(eq(productImages.productId, input.productId))
          .orderBy(productImages.sortOrder)
          .limit(1);

        if (first) {
          await tx
            .update(products)
            .set({ image: first.url, updatedAt: new Date() })
            .where(eq(products.id, input.productId));
        }
      });

      revalidatePath("/shop");
      revalidatePath("/admin/products");
      return { ok: true };
    }),

  setAlt: permissionProcedure("media.edit")
    .input(z.object({ id: z.string().uuid(), alt: z.string().trim().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(productImages)
        .set({ alt: input.alt })
        .where(eq(productImages.id, input.id));
      return { ok: true };
    }),

  /* ================================================================
     MEDIA LIBRARY
     ================================================================ */

  /** Records a finished upload in the library. Called straight after the
   *  browser PUTs the file, so the object always has a row. */
  record: permissionProcedure("media.edit")
    .input(
      z.object({
        key: z.string().trim().min(1),
        filename: z.string().trim().min(1),
        mimeType: z.enum(ALLOWED_IMAGE_TYPES),
        size: z.number().int().min(0),
        width: z.number().int().positive().nullable().default(null),
        height: z.number().int().positive().nullable().default(null),
        folder: z.string().trim().min(1).default("products"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(media)
        .values({
          key: input.key,
          url: publicUrl(input.key),
          filename: input.filename.replace(/\.[^.]+$/, ""),
          mimeType: input.mimeType,
          size: input.size,
          width: input.width,
          height: input.height,
          folder: input.folder,
          uploadedBy: ctx.user?.email ?? null,
        })
        .onConflictDoUpdate({
          target: media.key,
          set: { updatedAt: new Date() },
        })
        .returning();
      return row;
    }),

  /** The library grid: newest first, optional search and folder filter. */
  library: permissionProcedure("media.view")
    .input(
      z.object({
        search: z.string().trim().default(""),
        folder: z.string().trim().default(""),
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(48),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters = [];
      if (input.search) {
        const term = `%${input.search}%`;
        filters.push(or(ilike(media.filename, term), ilike(media.alt, term), ilike(media.title, term))!);
      }
      if (input.folder) filters.push(eq(media.folder, input.folder));
      const where = filters.length ? and(...filters) : undefined;

      const [items, [{ total }], counts, named] = await Promise.all([
        ctx.db
          .select()
          .from(media)
          .where(where)
          .orderBy(desc(media.createdAt))
          .limit(input.perPage)
          .offset((input.page - 1) * input.perPage),
        ctx.db.select({ total: sql<number>`count(*)::int` }).from(media).where(where),
        ctx.db
          .select({ folder: media.folder, count: sql<number>`count(*)::int` })
          .from(media)
          .groupBy(media.folder),
        ctx.db.select().from(mediaFolders).orderBy(asc(mediaFolders.name)),
      ]);

      // Named folders always show, even when empty.
      const bySlug = new Map(counts.map((c) => [c.folder, c.count]));
      const folders = named.map((f) => ({
        slug: f.slug,
        name: f.name,
        count: bySlug.get(f.slug) ?? 0,
      }));
      for (const [slug, count] of bySlug) {
        if (!folders.some((f) => f.slug === slug)) folders.push({ slug, name: slug, count });
      }

      return {
        items,
        total,
        page: input.page,
        pages: Math.max(1, Math.ceil(total / input.perPage)),
        folders,
      };
    }),

  /* ---------------- folders ---------------- */

  createFolder: permissionProcedure("media.edit")
    .input(z.object({ name: z.string().trim().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      const slug =
        input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "folder";
      try {
        const [row] = await ctx.db
          .insert(mediaFolders)
          .values({ slug, name: input.name })
          .returning();
        return row;
      } catch {
        throw new TRPCError({ code: "CONFLICT", message: "A folder with that name already exists." });
      }
    }),

  renameFolder: permissionProcedure("media.edit")
    .input(z.object({ slug: z.string().trim().min(1), name: z.string().trim().min(1).max(60) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(mediaFolders)
        .set({ name: input.name })
        .where(eq(mediaFolders.slug, input.slug));
      return { ok: true };
    }),

  /** Removes the folder. Its files move to `products`, never deleted. */
  deleteFolder: permissionProcedure("media.delete")
    .input(z.object({ slug: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx.update(media).set({ folder: "products" }).where(eq(media.folder, input.slug));
        await tx.delete(mediaFolders).where(eq(mediaFolders.slug, input.slug));
      });
      revalidatePath("/admin/media");
      return { ok: true };
    }),

  moveToFolder: permissionProcedure("media.edit")
    .input(z.object({ ids: z.array(z.string().uuid()).min(1), folder: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(media)
        .set({ folder: input.folder, updatedAt: new Date() })
        .where(inArray(media.id, input.ids));
      return { ok: true };
    }),

  /** Bulk delete from the library grid. */
  removeMany: permissionProcedure("media.delete")
    .input(z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db.select().from(media).where(inArray(media.id, input.ids));
      if (!rows.length) return { ok: true, deleted: 0 };
      const urls = rows.map((r) => r.url);

      await ctx.db.transaction(async (tx) => {
        await tx.delete(productImages).where(inArray(productImages.url, urls));
        await tx.update(products).set({ image: null }).where(inArray(products.image, urls));
        await tx.update(categories).set({ image: null }).where(inArray(categories.image, urls));
        await tx.delete(media).where(inArray(media.id, input.ids));
      });

      for (const row of rows) {
        if (!isStoredInR2(row.url)) continue;
        try {
          await deleteObject(row.url);
        } catch {
          /* row is gone either way */
        }
      }

      revalidatePath("/shop");
      revalidatePath("/admin/media");
      return { ok: true, deleted: rows.length };
    }),

  byIds: permissionProcedure("media.view")
    .input(z.object({ ids: z.array(z.string().uuid()).max(100) }))
    .query(async ({ ctx, input }) =>
      input.ids.length
        ? ctx.db.select().from(media).where(inArray(media.id, input.ids))
        : [],
    ),

  /** Rename the file, or edit its alt text and title. Renaming moves the
   *  object in the bucket, so every reference to the old URL is updated. */
  update: permissionProcedure("media.edit")
    .input(
      z.object({
        id: z.string().uuid(),
        filename: z.string().trim().min(1).max(120).optional(),
        alt: z.string().trim().nullable().optional(),
        title: z.string().trim().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.select().from(media).where(eq(media.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      let key = row.key;
      let url = row.url;

      const nextName = input.filename?.replace(/\.[^.]+$/, "").trim();
      if (nextName && nextName !== row.filename) {
        requireR2();
        try {
          const moved = await renameObject({
            key: row.key,
            filename: nextName,
            contentType: row.mimeType,
          });
          key = moved.key;
          url = moved.url;
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not rename the file in storage.",
          });
        }
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(media)
          .set({
            key,
            url,
            filename: nextName ?? row.filename,
            alt: input.alt === undefined ? row.alt : input.alt,
            title: input.title === undefined ? row.title : input.title,
            updatedAt: new Date(),
          })
          .where(eq(media.id, input.id));

        if (url !== row.url) {
          // Anything pointing at the old object follows it.
          await tx.update(productImages).set({ url }).where(eq(productImages.url, row.url));
          await tx
            .update(products)
            .set({ image: url, updatedAt: new Date() })
            .where(eq(products.image, row.url));
          await tx
            .update(categories)
            .set({ image: url, updatedAt: new Date() })
            .where(eq(categories.image, row.url));
        }
      });

      revalidatePath("/shop");
      revalidatePath("/admin/media");
      return { ok: true, url };
    }),

  /** How many things would break if this file went away. */
  usage: permissionProcedure("media.view")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db.select().from(media).where(eq(media.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const [gallery, mains, cats] = await Promise.all([
        ctx.db
          .select({ id: products.id, name: products.name })
          .from(productImages)
          .innerJoin(products, eq(products.id, productImages.productId))
          .where(eq(productImages.url, row.url)),
        ctx.db.select({ id: products.id, name: products.name }).from(products).where(eq(products.image, row.url)),
        ctx.db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.image, row.url)),
      ]);

      const seen = new Map<string, string>();
      for (const p of [...gallery, ...mains]) seen.set(p.id, p.name);
      return {
        products: Array.from(seen, ([id, name]) => ({ id, name })),
        categories: cats,
      };
    }),

  /** Deletes the row and the object. Gallery rows pointing at it go too. */
  removeFromLibrary: permissionProcedure("media.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.select().from(media).where(eq(media.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.transaction(async (tx) => {
        await tx.delete(productImages).where(eq(productImages.url, row.url));
        await tx.update(products).set({ image: null }).where(eq(products.image, row.url));
        await tx.update(categories).set({ image: null }).where(eq(categories.image, row.url));
        await tx.delete(media).where(eq(media.id, input.id));
      });

      if (isStoredInR2(row.url)) {
        try {
          await deleteObject(row.url);
        } catch {
          // The row is gone either way.
        }
      }

      revalidatePath("/shop");
      revalidatePath("/admin/media");
      return { ok: true };
    }),

  /** Points an existing library entry at a freshly uploaded object — used
   *  by the cropper, which uploads the cropped file first. */
  replaceFile: permissionProcedure("media.edit")
    .input(
      z.object({
        id: z.string().uuid(),
        key: z.string().trim().min(1),
        size: z.number().int().min(0),
        width: z.number().int().positive().nullable().default(null),
        height: z.number().int().positive().nullable().default(null),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.select().from(media).where(eq(media.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });

      const url = publicUrl(input.key);

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(media)
          .set({ key: input.key, url, size: input.size, width: input.width, height: input.height, updatedAt: new Date() })
          .where(eq(media.id, input.id));
        await tx.update(productImages).set({ url }).where(eq(productImages.url, row.url));
        await tx.update(products).set({ image: url, updatedAt: new Date() }).where(eq(products.image, row.url));
        await tx.update(categories).set({ image: url, updatedAt: new Date() }).where(eq(categories.image, row.url));
      });

      // The old object is no longer referenced anywhere.
      if (isStoredInR2(row.url) && keyFromUrl(row.url) !== input.key) {
        try {
          await deleteObject(row.url);
        } catch {
          /* orphan, not worth failing the request */
        }
      }

      revalidatePath("/shop");
      revalidatePath("/admin/media");
      return { ok: true, url, key: input.key };
    }),
});