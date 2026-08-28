import Link from "next/link";
import { AlertTriangle, Inbox, Package, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui-kit/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-kit/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-kit/table";
import { requireAdmin } from "@/lib/admin-guard";
import {
  bestSellers,
  dashboardStats,
  lowStockProducts,
  recentOrders,
} from "@/lib/admin-queries";
import { formatPrice } from "@/lib/shop-config";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const [stats, orders, lowStock, sellers] = await Promise.all([
    dashboardStats(),
    recentOrders(),
    lowStockProducts(),
    bestSellers(),
  ]);

  const tiles = [
    {
      label: "Revenue",
      value: formatPrice(stats.revenue),
      note: "Paid orders, all time",
      icon: ShoppingCart,
    },
    {
      label: "Orders",
      value: String(stats.orders),
      note: `${stats.pending} awaiting payment`,
      icon: ShoppingCart,
    },
    {
      label: "Active products",
      value: String(stats.products),
      note: `${stats.lowStock} low on stock`,
      icon: Package,
    },
    {
      label: "Open enquiries",
      value: String(stats.openEnquiries),
      note: "Not yet handled",
      icon: Inbox,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here is where the shop stands right now.
        </p>
      </div>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Card key={tile.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tile.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{tile.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{tile.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {orders.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                          {order.number}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.customerName ?? order.email}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No orders yet. They will appear here the moment one is placed.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Low stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStock.length ? (
                lowStock.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                      {product.stock}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Everything is comfortably in stock.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best sellers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sellers.length ? (
                sellers.map((item) => (
                  <div key={item.sku} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm">{item.name}</p>
                    <span className="text-sm text-muted-foreground">
                      {item.units}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing sold in the last 90 days.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
