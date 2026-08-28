import "server-only";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { enquiries, orderItems, orders, products } from "@/db/schema";

/** Numbers for the dashboard. One round trip per figure, all cheap. */
export async function dashboardStats() {
  const paidStatuses = ["paid", "processing", "shipped", "completed"] as const;

  const [
    [revenue],
    [orderCount],
    [pendingCount],
    [productCount],
    [lowStock],
    [openEnquiries],
  ] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
      .from(orders)
      .where(sql`${orders.status} in ${paidStatuses}`),
    db.select({ value: count() }).from(orders),
    db.select({ value: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ value: count() }).from(products).where(eq(products.active, true)),
    db
      .select({ value: count() })
      .from(products)
      .where(
        and(
          eq(products.trackStock, true),
          lte(products.stock, sql`${products.lowStockAt}`),
        ),
      ),
    db.select({ value: count() }).from(enquiries).where(eq(enquiries.handled, false)),
  ]);

  return {
    revenue: revenue?.total ?? 0,
    orders: orderCount?.value ?? 0,
    pending: pendingCount?.value ?? 0,
    products: productCount?.value ?? 0,
    lowStock: lowStock?.value ?? 0,
    openEnquiries: openEnquiries?.value ?? 0,
  };
}

export async function recentOrders(limit = 8) {
  return db
    .select({
      id: orders.id,
      number: orders.number,
      email: orders.email,
      customerName: orders.customerName,
      status: orders.status,
      total: orders.total,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .orderBy(desc(orders.placedAt))
    .limit(limit);
}

export async function lowStockProducts(limit = 8) {
  return db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      stock: products.stock,
      lowStockAt: products.lowStockAt,
    })
    .from(products)
    .where(
      and(
        eq(products.trackStock, true),
        eq(products.active, true),
        lte(products.stock, sql`${products.lowStockAt}`),
      ),
    )
    .orderBy(products.stock)
    .limit(limit);
}

/** Units sold per product, for the "best sellers" panel. */
export async function bestSellers(limit = 5) {
  return db
    .select({
      name: orderItems.name,
      sku: orderItems.sku,
      units: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPrice})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(gte(orders.placedAt, sql`now() - interval '90 days'`))
    .groupBy(orderItems.name, orderItems.sku)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit);
}
