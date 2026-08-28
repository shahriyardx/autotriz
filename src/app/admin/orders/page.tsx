import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatuses } from "@/db/schema";
import { requirePermission } from "@/lib/admin-guard";
import { formatPrice } from "@/lib/shop-config";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit/table";
import { cn } from "@/lib/cn";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("orders.view");
  const { status } = await searchParams;
  const filter = orderStatuses.find((s) => s === status);

  const rows = await db
    .select()
    .from(orders)
    .where(filter ? eq(orders.status, filter) : undefined)
    .orderBy(desc(orders.placedAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "order" : "orders"}
          {filter ? ` with status “${filter}”` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
            !filter ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
          )}
        >
          All
        </Link>
        {orderStatuses.map((value) => (
          <Link
            key={value}
            href={`/admin/orders?status=${value}`}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
              filter === value
                ? "border-foreground bg-foreground text-background"
                : "hover:bg-muted",
            )}
          >
            {value}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.placedAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <p>{order.customerName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{order.email}</p>
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPrice(order.total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No orders yet. They arrive here as soon as checkout is live.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
