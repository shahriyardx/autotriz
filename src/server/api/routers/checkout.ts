import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import Stripe from "stripe";
import { customerAddresses, orderItems, orders } from "@/db/schema";
import { user } from "@/db/auth-schema";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { auth } from "@/lib/auth";
import { getProduct, inStock } from "@/lib/catalogue";
import { checkoutInput, shippingFor } from "@/lib/checkout";
import { FREE_SHIPPING_THRESHOLD, currency } from "@/lib/shop-config";
import { site } from "@/lib/site";
import type { Address } from "@/db/schema";

/* ==================================================================
   Placing an order.

   Every price, every stock level and every total is read on the server.
   The browser's copy of the cart is only a list of slugs and counts.
   ================================================================== */

const toAddress = (input: z.infer<typeof checkoutInput>["shipping"]): Address => ({
  name: input.name,
  phone: input.phone || undefined,
  line1: input.line1,
  line2: input.line2 || undefined,
  city: input.city,
  region: input.region || undefined,
  postcode: input.postcode || undefined,
  country: input.country,
});

/** AT-1042, AT-1043 … readable, and unique by the sequence behind it. */
async function nextOrderNumber(db: typeof import("@/db").db) {
  const [row] = await db
    .select({ number: orders.number })
    .from(orders)
    .orderBy(desc(orders.placedAt))
    .limit(1);

  const last = Number(row?.number?.replace(/\D/g, "") ?? 0);
  return `AT-${Math.max(1000, last) + 1}`;
}

export const checkoutRouter = createTRPCRouter({
  /** Prices the cart without placing anything, for the summary. */
  quote: publicProcedure
    .input(z.object({ lines: z.array(z.object({ slug: z.string(), quantity: z.number().int().min(1).max(99) })) }))
    .query(async ({ input }) => {
      const priced = await Promise.all(
        input.lines.map(async (line) => {
          const product = await getProduct(line.slug);
          return product ? { product, quantity: line.quantity } : null;
        }),
      );

      const lines = priced.filter(Boolean) as { product: NonNullable<Awaited<ReturnType<typeof getProduct>>>; quantity: number }[];
      const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
      const shipping = shippingFor(subtotal, FREE_SHIPPING_THRESHOLD);

      return {
        lines: lines.map((l) => ({
          slug: l.product.slug,
          name: l.product.name,
          sku: l.product.sku,
          size: l.product.size,
          image: l.product.image,
          unitPrice: l.product.price,
          quantity: l.quantity,
          available: inStock(l.product),
        })),
        subtotal,
        shipping,
        total: subtotal + shipping,
      };
    }),

  place: publicProcedure.input(checkoutInput).mutation(async ({ ctx, input }) => {
    /* ---- price the cart from the catalogue, never from the browser ---- */
    const priced = await Promise.all(
      input.lines.map(async (line) => {
        const product = await getProduct(line.slug);
        return product ? { product, quantity: line.quantity } : null;
      }),
    );
    const lines = priced.filter(Boolean) as {
      product: NonNullable<Awaited<ReturnType<typeof getProduct>>>;
      quantity: number;
    }[];

    if (!lines.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Your cart is empty." });
    }

    const unavailable = lines.filter((l) => !inStock(l.product));
    if (unavailable.length) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `${unavailable.map((l) => l.product.name).join(", ")} went out of stock. Remove it and try again.`,
      });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
    const shipping = shippingFor(subtotal, FREE_SHIPPING_THRESHOLD);
    const total = subtotal + shipping;

    const email = input.email.trim().toLowerCase();
    let userId = ctx.user?.id ?? null;

    /* ---- optionally open an account on the way through ---- */
    if (!userId && input.createAccount) {
      const [taken] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(sql`lower(${user.email}) = ${email}`)
        .limit(1);

      if (taken) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with that email already exists. Sign in first, or order as a guest.",
        });
      }

      try {
        await auth.api.signUpEmail({
          body: { email, password: input.password ?? "", name: input.shipping.name },
        });
        const [created] = await ctx.db
          .select({ id: user.id })
          .from(user)
          .where(sql`lower(${user.email}) = ${email}`)
          .limit(1);
        userId = created?.id ?? null;
        if (userId) {
          await ctx.db.update(user).set({ phone: input.phone }).where(eq(user.id, userId));
        }
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not create the account. Try a different password, or order as a guest.",
        });
      }
    }

    /* ---- record the order ---- */
    const shippingAddress = toAddress(input.shipping);
    const billingAddress = input.billingSameAsShipping
      ? shippingAddress
      : toAddress(input.billing ?? input.shipping);

    const number = await nextOrderNumber(ctx.db);
    const wantsCard = input.paymentMethod === "card" && Boolean(process.env.STRIPE_SECRET_KEY);

    const order = await ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(orders)
        .values({
          number,
          status: "pending",
          userId,
          email,
          customerName: input.shipping.name,
          phone: input.phone,
          currency: currency.code,
          subtotal,
          shipping,
          total,
          shippingAddress,
          billingAddress,
          notes: input.notes || null,
          paymentMethod: wantsCard ? "card" : input.paymentMethod === "card" ? "cod" : input.paymentMethod,
          paymentStatus: "unpaid",
        })
        .returning();

      await tx.insert(orderItems).values(
        lines.map((l) => ({
          orderId: row.id,
          productId: l.product.id,
          name: l.product.name,
          sku: l.product.sku,
          unitPrice: l.product.price,
          quantity: l.quantity,
        })),
      );

      if (userId && input.saveAddress) {
        await tx.insert(customerAddresses).values({
          userId,
          label: "Delivery address",
          address: shippingAddress,
          isDefault: true,
        });
      }

      return row;
    });

    /* ---- card payments hand over to Stripe ---- */
    if (wantsCard) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const base = (process.env.APP_URL ?? site.url).replace(/\/$/, "");

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        client_reference_id: order.id,
        line_items: [
          ...lines.map(({ product, quantity }) => ({
            quantity,
            price_data: {
              currency: currency.code.toLowerCase(),
              unit_amount: product.price,
              product_data: {
                name: product.name,
                description: product.size ? `${product.sku} · ${product.size}` : product.sku,
              },
            },
          })),
          ...(shipping
            ? [
                {
                  quantity: 1,
                  price_data: {
                    currency: currency.code.toLowerCase(),
                    unit_amount: shipping,
                    product_data: { name: "Delivery" },
                  },
                },
              ]
            : []),
        ],
        success_url: `${base}/order/${order.number}?paid=1`,
        cancel_url: `${base}/checkout`,
      });

      await ctx.db
        .update(orders)
        .set({ stripeSessionId: session.id })
        .where(eq(orders.id, order.id));

      return { number: order.number, redirectTo: session.url };
    }

    return { number: order.number, redirectTo: null };
  }),

  /** The confirmation page. A guest may read their own order with the
   *  email they used; a signed-in customer just needs to own it. */
  byNumber: publicProcedure
    .input(z.object({ number: z.string().trim().min(3), email: z.string().trim().optional() }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.number, input.number.toUpperCase()))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const mine = ctx.user?.id && order.userId === ctx.user.id;
      const matches =
        input.email && order.email.toLowerCase() === input.email.trim().toLowerCase();

      if (!mine && !matches) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sign in, or enter the email address used for the order.",
        });
      }

      const items = await ctx.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return { order, items };
    }),
});

/* ------------------------------------------------------------------
   The customer's own account: their orders, details and addresses.
   ------------------------------------------------------------------ */

const customerProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in first." });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const accountRouter = createTRPCRouter({
  orders: customerProcedure.query(async ({ ctx }) =>
    ctx.db
      .select({
        id: orders.id,
        number: orders.number,
        status: orders.status,
        total: orders.total,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        placedAt: orders.placedAt,
      })
      .from(orders)
      .where(eq(orders.userId, ctx.user.id))
      .orderBy(desc(orders.placedAt))
      .limit(100),
  ),

  order: customerProcedure
    .input(z.object({ number: z.string().trim().min(3) }))
    .query(async ({ ctx, input }) => {
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(and(eq(orders.number, input.number.toUpperCase()), eq(orders.userId, ctx.user.id)))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const items = await ctx.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return { order, items };
    }),

  profile: customerProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ name: user.name, email: user.email, phone: user.phone })
      .from(user)
      .where(eq(user.id, ctx.user.id))
      .limit(1);
    return row ?? { name: ctx.user.name, email: ctx.user.email, phone: null };
  }),

  updateProfile: customerProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Enter your name"),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(user)
        .set({ name: input.name, phone: input.phone || null, updatedAt: new Date() })
        .where(eq(user.id, ctx.user.id));
      return { ok: true };
    }),

  addresses: customerProcedure.query(async ({ ctx }) =>
    ctx.db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, ctx.user.id))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt)),
  ),

  saveAddress: customerProcedure
    .input(z.object({ id: z.uuid().optional(), label: z.string().trim().max(60).optional(), address: checkoutInput.shape.shipping }))
    .mutation(async ({ ctx, input }) => {
      const address = toAddress(input.address);
      if (input.id) {
        await ctx.db
          .update(customerAddresses)
          .set({ address, label: input.label || null })
          .where(and(eq(customerAddresses.id, input.id), eq(customerAddresses.userId, ctx.user.id)));
      } else {
        const existing = await ctx.db
          .select({ id: customerAddresses.id })
          .from(customerAddresses)
          .where(eq(customerAddresses.userId, ctx.user.id));
        await ctx.db.insert(customerAddresses).values({
          userId: ctx.user.id,
          label: input.label || null,
          address,
          isDefault: existing.length === 0,
        });
      }
      return { ok: true };
    }),

  deleteAddress: customerProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(customerAddresses)
        .where(and(eq(customerAddresses.id, input.id), eq(customerAddresses.userId, ctx.user.id)));
      return { ok: true };
    }),

  setDefaultAddress: customerProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(customerAddresses)
          .set({ isDefault: false })
          .where(eq(customerAddresses.userId, ctx.user.id));
        await tx
          .update(customerAddresses)
          .set({ isDefault: true })
          .where(and(eq(customerAddresses.id, input.id), eq(customerAddresses.userId, ctx.user.id)));
      });
      return { ok: true };
    }),
});
